import re
import sys
import json
import subprocess
import urllib.request
from datetime import datetime, timezone, timedelta
from collections import defaultdict

# 24 hour window
now_utc = datetime(2026, 11, 19, 1, 51, 29, tzinfo=timezone.utc)
h24_ago = now_utc - timedelta(hours=24)

print(f"=== DEEP 24H REAL VISITOR AUDIT ===")
print(f"Window: {h24_ago.strftime('%Y-%m-%d %H:%M:%S UTC')} to {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")

log_regex = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+)(?: [^"]*)?" (?P<status>\d+) (?P<bytes>\d+) "(?P<referrer>[^"]*)" "(?P<ua>[^"]*)"'
)

# Known crawlers and bots
BOT_UA_PATTERNS = [
    r'bot\b', r'crawler', r'spider', r'slurp', r'archiver', r'transcoder', r'fetcher',
    r'semrush', r'ahrefs', r'mj12', r'dotbot', r'censys', r'shodan', r'zoomeye',
    r'netcraft', r'uptime', r'monitor', r'probe', r'zgrab', r'masscan', r'nmap',
    r'sqlmap', r'nikto', r'nuclei', r'go-http-client', r'python', r'aiohttp',
    r'curl', r'wget', r'scrapy', r'headless', r'phantom', r'selenium', r'puppeteer',
    r'lighthouse', r'siteimprove', r'turnitin', r'chatgpt', r'anthropic', r'cohere',
    r'omgili', r'facebookexternalhit', r'twitterbot', r'linkedinbot', r'slackbot', r'discordbot',
    r'telegrambot', r'whatsapp', r'amazonbot', r'dataforseo', r'exasearch', r'infrawatch', r'pi-web-tools',
    r'googlebot', r'bingbot', r'yandex', r'baiduspider', r'petalbot', r'applebot',
    r'keyhunter', r'opendir-scanner', r'cyberconvoy', r'cortex-xpanse', r'palo alto networks',
    r'grok-fp', r'agent-search', r'vercel-image-optimization', r'libredtail', r'visionheight',
    r'notiondomainchecker', r'dsh-harvest', r'synthient', r'fhms-its-research', r'highperfscanner',
    r'keyscanner', r'odin', r'godseye', r'modatscanner', r'i1232-configscan', r'syncinity'
]
bot_regex = re.compile('|'.join(BOT_UA_PATTERNS), re.IGNORECASE)

# Vulnerability scan paths
VULN_PATH_PATTERNS = [
    r'\.php', r'\.env', r'wp-', r'/xmlrpc', r'/telescope', r'/actuator',
    r'/solr', r'/phpmyadmin', r'/pma', r'/\.git', r'^/setup', r'/admin\.asp',
    r'/shell', r'/boaform', r'/hnap1', r'/vendor/', r'/cgi-bin', r'/aws/',
    r'/owa', r'/autodiscover', r'/\.well-known', r'/dicom-web', r'/odinhttpcall',
    r'/webui/', r'hetong\.js', r'check\.js', r'/v3/settings', r'/sdk', r'/app\.json'
]
vuln_regex = re.compile('|'.join(VULN_PATH_PATTERNS), re.IGNORECASE)

ADMIN_IPS = {'9.142.21.227'}

all_records = []
for fpath in ['/var/log/nginx/access.log', '/var/log/nginx/access.log.1']:
    try:
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                m = log_regex.match(line)
                if not m:
                    continue
                d = m.groupdict()
                try:
                    dt = datetime.strptime(d['time'], '%d/%b/%Y:%H:%M:%S %z')
                except Exception:
                    continue
                
                # Check 24h window
                if dt < h24_ago or dt > now_utc:
                    continue
                
                d['dt'] = dt
                d['status'] = int(d['status'])
                d['bytes'] = int(d['bytes'])
                all_records.append(d)
    except FileNotFoundError:
        pass

all_records.sort(key=lambda x: x['dt'])
print(f"Total requests strictly in 24h window: {len(all_records)}")

# Group by IP
ip_groups = defaultdict(list)
for r in all_records:
    ip_groups[r['ip']].append(r)

print(f"Total unique IPs in 24h: {len(ip_groups)}")

# Query database for users and track events
def run_sql(sql):
    cmd = ["docker", "exec", "-i", "postgres", "psql", "-U", "root", "-d", "new-api", "-t", "-A", "-c", sql]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.stdout.strip()

sql_users = f"SELECT id, username, email, display_name, register_ip, register_country, register_lang, first_referrer, first_landing, quota, used_quota, request_count, to_timestamp(created_at) at time zone 'UTC' FROM users WHERE created_at >= {int(h24_ago.timestamp())};"
users_out = run_sql(sql_users)
registered_users = []
if users_out:
    for line in users_out.split('\n'):
        if line.strip():
            parts = line.split('|')
            if len(parts) >= 13:
                registered_users.append({
                    'id': parts[0],
                    'username': parts[1],
                    'email': parts[2],
                    'display_name': parts[3],
                    'ip': parts[4],
                    'country': parts[5],
                    'lang': parts[6],
                    'referrer': parts[7],
                    'landing': parts[8],
                    'quota': parts[9],
                    'used_quota': parts[10],
                    'request_count': parts[11],
                    'created_at': parts[12]
                })

sql_events = f"SELECT id, user_id, anonymous_id, event_name, properties, page_url, ip, to_timestamp(created_at) at time zone 'UTC' FROM track_events WHERE created_at >= {int(h24_ago.timestamp())} ORDER BY created_at ASC;"
events_out = run_sql(sql_events)
track_events = []
if events_out:
    for line in events_out.split('\n'):
        if line.strip():
            parts = line.split('|')
            if len(parts) >= 8:
                track_events.append({
                    'id': parts[0],
                    'user_id': parts[1],
                    'anon_id': parts[2],
                    'event_name': parts[3],
                    'props': parts[4],
                    'page_url': parts[5],
                    'ip': parts[6],
                    'time': parts[7]
                })

# Batch GeoIP
unique_ips = list(ip_groups.keys())
geoip_results = {}
for i in range(0, len(unique_ips), 100):
    batch = unique_ips[i:i+100]
    payload = json.dumps([{"query": ip} for ip in batch]).encode('utf-8')
    try:
        req = urllib.request.Request(
            "http://ip-api.com/batch",
            data=payload,
            headers={'Content-Type': 'application/json', 'User-Agent': 'ApivelBatchGeo/1.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for item in data:
                q = item.get('query')
                if item.get('status') == 'success':
                    geoip_results[q] = {
                        'country': item.get('country', 'Unknown'),
                        'countryCode': item.get('countryCode', '??'),
                        'city': item.get('city', 'Unknown'),
                        'region': item.get('regionName', ''),
                        'isp': item.get('isp', ''),
                        'org': item.get('org', ''),
                        'as': item.get('as', '')
                    }
                else:
                    geoip_results[q] = {'country': 'Unknown', 'countryCode': '??', 'city': 'Unknown', 'region': '', 'isp': '', 'org': '', 'as': ''}
    except Exception as e:
        for ip in batch:
            geoip_results[ip] = {'country': 'Unknown', 'countryCode': '??', 'city': 'Unknown', 'region': '', 'isp': '', 'org': '', 'as': ''}

# Categorize each IP
# 1. Admin
# 2. Known Bot / Crawler
# 3. Vulnerability Scanner / Probe
# 4. Single-hit Datacenter Probe (e.g. hits / or /favicon.ico once from cloud VPS with fake UA)
# 5. Genuine Human Visitor (High confidence: interacted with UI, read blog, visited pricing, registered, or multiple page requests with realistic dwell time)

admin_sessions = []
bot_sessions = []
vuln_sessions = []
cloud_probe_sessions = []
genuine_human_sessions = []

for ip, reqs in ip_groups.items():
    geo = geoip_results.get(ip, {'country': 'Unknown', 'city': 'Unknown', 'isp': '', 'org': '', 'as': ''})
    reqs.sort(key=lambda x: x['dt'])
    first_dt = reqs[0]['dt']
    last_dt = reqs[-1]['dt']
    dwell = (last_dt - first_dt).total_seconds()
    uas = list(set([r['ua'] for r in reqs]))
    paths = [r['path'] for r in reqs]
    non_static_paths = [p for p in paths if not any(p.endswith(ext) for ext in ['.js', '.css', '.svg', '.png', '.jpg', '.woff2', '.map', '.ico'])]
    referrers = list(set([r['referrer'] for r in reqs if r['referrer'] and r['referrer'] != '-']))
    
    # Check if matched user or events
    matched_u = next((u for u in registered_users if u['ip'] == ip), None)
    # Also check if user 39 switch IP
    if not matched_u:
        for u in registered_users:
            if u['id'] == '39' and ip in ['240a:42b8:6e20:12aa:f45a:daff:fe91:6c47', '114.55.167.105']:
                matched_u = u
                break
                
    matched_e = [e for e in track_events if e['ip'] == ip or (matched_u and e['user_id'] == matched_u['id'])]

    session_obj = {
        'ip': ip,
        'geo': geo,
        'req_count': len(reqs),
        'dwell_seconds': dwell,
        'first_seen': first_dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'last_seen': last_dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'referrers': referrers if referrers else ["Direct / None"],
        'uas': uas,
        'paths': paths,
        'key_pages': non_static_paths if non_static_paths else paths,
        'matched_user': matched_u,
        'matched_events': matched_e
    }

    # 1. Admin
    if ip in ADMIN_IPS:
        admin_sessions.append(session_obj)
        continue

    # 2. Known Bot
    if any(bot_regex.search(ua) for ua in uas):
        bot_sessions.append(session_obj)
        continue

    # 3. Vulnerability probe path
    if any(vuln_regex.search(p) for p in paths):
        vuln_sessions.append(session_obj)
        continue

    # 4. Check if matched user
    if matched_u or matched_e:
        genuine_human_sessions.append(session_obj)
        continue

    # 5. Check if real human browsing
    # Real human signals:
    # - Loaded blog post or pricing or console/register
    # - Dwell time > 0 and loaded multiple assets or pages
    # - Has referrer from search engine or twitter or external site
    # - Browser is normal desktop/mobile OS (Windows, Mac, iOS, Android)
    is_cloud_isp = bool(re.search(r'Alibaba|Tencent|DigitalOcean|Amazon|Google Cloud|Microsoft|Oracle|Cloudflare|Hetzner|OVH|Linode|Vultr|Choopa|Fastly|Akamai|Ucloud|Huawei Cloud|Zenlayer|Contabo|Datacamp|Flyservers|NewVM', geo.get('isp', '') + ' ' + geo.get('org', '') + ' ' + geo.get('as', ''), re.IGNORECASE))
    
    has_meaningful_page = any(
        p.startswith('/blog/') or p.startswith('/pricing') or 
        p.startswith('/console') or p.startswith('/sign-in') or 
        p.startswith('/sign-up') or p.startswith('/models') or 
        p.startswith('/docs') or p.startswith('/about') or p.startswith('/terms')
        for p in paths
    )

    has_search_referrer = any('google' in r.lower() or 'bing' in r.lower() or 'x.com' in r.lower() or 'twitter' in r.lower() or 'reddit' in r.lower() for r in referrers)

    if has_search_referrer or (has_meaningful_page and not is_cloud_isp) or (has_meaningful_page and dwell > 2):
        genuine_human_sessions.append(session_obj)
    elif not is_cloud_isp and (dwell > 0 or len(paths) >= 2 or any(p == '/' for p in paths)):
        # Residential / Mobile broadband visitors checking home page
        genuine_human_sessions.append(session_obj)
    elif is_cloud_isp and dwell == 0 and len(paths) <= 2 and not has_meaningful_page:
        cloud_probe_sessions.append(session_obj)
    elif is_cloud_isp and all(p in ['/', '/favicon.ico'] for p in paths) and dwell < 2:
        cloud_probe_sessions.append(session_obj)
    else:
        # Check if they have repetitive automated hits
        if dwell > 3000 and len(reqs) == 2 and all(p == '/' for p in paths):
            # Automated interval health check / uptime
            cloud_probe_sessions.append(session_obj)
        else:
            genuine_human_sessions.append(session_obj)

print(f"\nBreakdown:")
print(f"  - Admin: {len(admin_sessions)}")
print(f"  - Bots / Crawlers: {len(bot_sessions)}")
print(f"  - Vulnerability Scanners / Exploit Probes: {len(vuln_sessions)}")
print(f"  - Automated Cloud Hits / Headless Pings: {len(cloud_probe_sessions)}")
print(f"  - High Confidence Genuine Human Visitors: {len(genuine_human_sessions)}")

# Deep inspect Genuine Human Sessions
print(f"\n=======================================================")
print(f"=== GENUINE HUMAN SESSIONS DETAILS ({len(genuine_human_sessions)}) ===")
print(f"=======================================================")

output_data = []

for idx, s in enumerate(genuine_human_sessions, 1):
    dwell_m = int(s['dwell_seconds'] // 60)
    dwell_s = int(s['dwell_seconds'] % 60)
    dwell_str = f"{dwell_m}m {dwell_s}s" if dwell_m > 0 else f"{dwell_s}s"
    
    # Assess Survey
    survey_done = any(e['event_name'] == 'onboarding_survey_submitted' for e in s['matched_events'])
    
    # Assess Payment Conversion Intent
    # 1. Very High: clicked payment / topup
    # 2. High: registered user, copied API key, or visited wallet
    # 3. Medium: visited pricing page or comparison
    # 4. Low: read blog / landing page
    intent = "LOW"
    intent_reason = []
    
    if any(e['event_name'] in ['select_pay_tier', 'click_payment'] for e in s['matched_events']):
        intent = "VERY HIGH"
        intent_reason.append("Directly interacted with payment options")
    elif any('topup' in p or 'wallet' in p for p in s['paths']) or any(e['event_name'] == 'view_topup' for e in s['matched_events']):
        intent = "HIGH"
        intent_reason.append("Viewed topup / wallet page")
    elif s['matched_user']:
        intent = "HIGH"
        intent_reason.append("Completed registration and obtained API key")
    elif any('pricing' in p for p in s['paths']):
        intent = "MEDIUM"
        intent_reason.append("Visited /pricing page to check rates")
    elif any('sign-in' in p or 'sign-up' in p for p in s['paths']):
        intent = "MEDIUM"
        intent_reason.append("Reached login / signup page")
    elif any(p.startswith('/blog/') for p in s['paths']):
        intent = "LOW-MEDIUM"
        intent_reason.append("Read technical blog benchmark article")
    else:
        intent = "LOW"
        intent_reason.append("Landed on homepage only")
        
    info = {
        'id': idx,
        'ip': s['ip'],
        'country': s['geo']['country'],
        'city': s['geo']['city'],
        'isp': s['geo']['isp'],
        'first_seen': s['first_seen'],
        'last_seen': s['last_seen'],
        'dwell_str': dwell_str,
        'dwell_seconds': s['dwell_seconds'],
        'req_count': s['req_count'],
        'referrers': s['referrers'],
        'ua': s['uas'][0] if s['uas'] else '',
        'key_pages': s['key_pages'][:10],
        'user': s['matched_user'],
        'events': [e['event_name'] for e in s['matched_events']],
        'survey_done': survey_done,
        'intent': intent,
        'intent_reason': intent_reason
    }
    output_data.append(info)
    
    print(f"Visitor #{idx}: {s['ip']} | {s['geo']['country']} ({s['geo']['city']}) | ISP: {s['geo']['isp']}")
    print(f"  Time: {s['first_seen']} ~ {s['last_seen']} (Dwell: {dwell_str}, Requests: {s['req_count']})")
    print(f"  Referrer: {', '.join(s['referrers'])}")
    print(f"  UA: {s['uas'][0] if s['uas'] else ''}")
    print(f"  Trajectory: {' -> '.join(s['key_pages'][:8])}")
    print(f"  Survey Completed: {'YES' if survey_done else 'NO'}")
    print(f"  Intent: {intent} ({', '.join(intent_reason)})")
    if s['matched_user']:
        print(f"  User: ID={s['matched_user']['id']}, Username={s['matched_user']['username']}, Email={s['matched_user']['email']}, RegTime={s['matched_user']['created_at']}")
    if s['matched_events']:
        print(f"  Events: {[e['event_name'] for e in s['matched_events']]}")
    print("-" * 75)

with open('/root/deep_24h_result.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print("\nSaved result to /root/deep_24h_result.json")

