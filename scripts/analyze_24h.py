import re
import sys
import json
import subprocess
import urllib.request
from datetime import datetime, timezone, timedelta
from collections import defaultdict

now_utc = datetime.now(timezone.utc)
h24_ago = now_utc - timedelta(hours=24)
h36_ago = now_utc - timedelta(hours=36)

print(f"=== APIVEL REAL VISITOR 24H AUDIT ===")
print(f"Current UTC: {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
print(f"24h Window:  {h24_ago.strftime('%Y-%m-%d %H:%M:%S UTC')} ~ {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
print(f"36h Window:  {h36_ago.strftime('%Y-%m-%d %H:%M:%S UTC')} ~ {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}\n")

log_regex = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+)(?: [^"]*)?" (?P<status>\d+) (?P<bytes>\d+) "(?P<referrer>[^"]*)" "(?P<ua>[^"]*)"'
)

BOT_PATTERNS = [
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
    r'keyscanner', r'odin'
]
bot_regex = re.compile('|'.join(BOT_PATTERNS), re.IGNORECASE)

SCANNER_PATH_PATTERNS = [
    r'\.php', r'\.env', r'wp-', r'/xmlrpc', r'/telescope', r'/actuator',
    r'/solr', r'/phpmyadmin', r'/pma', r'/\.git', r'^/setup', r'/admin\.asp',
    r'/shell', r'/boaform', r'/hnap1', r'/vendor/', r'/cgi-bin', r'/aws/',
    r'/owa', r'/autodiscover', r'/\.well-known', r'/robots\.txt',
    r'/sitemap', r'/dicom-web', r'/odinhttpcall', r'/webui/'
]
scanner_path_regex = re.compile('|'.join(SCANNER_PATH_PATTERNS), re.IGNORECASE)

ADMIN_IPS = {'9.142.21.227'}

records = []
log_files = ['/var/log/nginx/access.log', '/var/log/nginx/access.log.1']

for fpath in log_files:
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
                
                if dt < h36_ago:
                    continue
                
                d['dt'] = dt
                d['status'] = int(d['status'])
                d['bytes'] = int(d['bytes'])
                records.append(d)
    except FileNotFoundError:
        pass

records.sort(key=lambda x: x['dt'])

# Classify
bot_count = 0
scanner_count = 0
admin_count = 0
real_records = []

for r in records:
    ip = r['ip']
    ua = r['ua']
    path = r['path']
    
    if ip in ADMIN_IPS:
        admin_count += 1
        continue
    
    if bot_regex.search(ua):
        bot_count += 1
        continue
        
    if scanner_path_regex.search(path):
        scanner_count += 1
        continue
        
    if ua == '-' or len(ua) < 15 or ua == 'Mozilla/5.0':
        scanner_count += 1
        continue
        
    real_records.append(r)

print(f"Total requests in past 36h: {len(records)}")
print(f"  - Bots/Crawlers excluded: {bot_count}")
print(f"  - Scanner/Probes excluded: {scanner_count}")
print(f"  - Admin operations excluded: {admin_count}")
print(f"  - Potential Real Human requests: {len(real_records)}")

# Group by IP
ip_groups = defaultdict(list)
for r in real_records:
    ip_groups[r['ip']].append(r)

# Exclude IP clusters that do brute force (e.g. >10 requests to /api/user/login)
filtered_ips = {}
for ip, reqs in ip_groups.items():
    login_posts = [r for r in reqs if r['path'] == '/api/user/login']
    if len(login_posts) > 5:
        # Brute force bot
        continue
    # Exclude scanner clusters that hit 5 pages in 1 second
    if len(reqs) >= 4:
        span = (reqs[-1]['dt'] - reqs[0]['dt']).total_seconds()
        if span < 2 and any(r['path'] in ['/about', '/terms', '/privacy'] for r in reqs):
            continue
    filtered_ips[ip] = reqs

print(f"  - Unique real human visitor IPs identified: {len(filtered_ips)}")

# Batch GeoIP Lookup
unique_ips = list(filtered_ips.keys())
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
        print(f"GeoIP batch error: {e}")
        for ip in batch:
            geoip_results[ip] = {'country': 'Unknown', 'countryCode': '??', 'city': 'Unknown', 'region': '', 'isp': '', 'org': '', 'as': ''}

# Query Postgres
def run_sql(sql):
    cmd = ["docker", "exec", "-i", "postgres", "psql", "-U", "root", "-d", "new-api", "-t", "-A", "-c", sql]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.stdout.strip()

sql_users = f"SELECT id, username, email, register_ip, register_country, register_lang, first_referrer, first_landing, quota, used_quota, request_count, to_timestamp(created_at) at time zone 'UTC' FROM users WHERE created_at >= {int(h36_ago.timestamp())};"
users_out = run_sql(sql_users)
registered_users = []
if users_out:
    for line in users_out.split('\n'):
        if line.strip():
            parts = line.split('|')
            if len(parts) >= 12:
                registered_users.append({
                    'id': parts[0],
                    'username': parts[1],
                    'email': parts[2],
                    'ip': parts[3],
                    'country': parts[4],
                    'lang': parts[5],
                    'referrer': parts[6],
                    'landing': parts[7],
                    'quota': parts[8],
                    'used_quota': parts[9],
                    'request_count': parts[10],
                    'created_at': parts[11]
                })

sql_events = f"SELECT id, user_id, anonymous_id, event_name, properties, page_url, ip, to_timestamp(created_at) at time zone 'UTC' FROM track_events WHERE created_at >= {int(h36_ago.timestamp())} ORDER BY created_at ASC;"
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

sessions = []
for ip, reqs in filtered_ips.items():
    reqs.sort(key=lambda x: x['dt'])
    first_dt = reqs[0]['dt']
    last_dt = reqs[-1]['dt']
    dwell = (last_dt - first_dt).total_seconds()
    is_in_24h = last_dt >= h24_ago
    geo = geoip_results.get(ip, {'country': 'Unknown', 'city': 'Unknown'})
    
    # Filter static assets for trajectory
    key_pages = [r['path'] for r in reqs if not any(r['path'].endswith(ext) for ext in ['.js', '.css', '.svg', '.png', '.jpg', '.woff2', '.map', '.json'])]
    if not key_pages:
        key_pages = [r['path'] for r in reqs]
        
    referrers = list(set([r['referrer'] for r in reqs if r['referrer'] and r['referrer'] != '-']))
    uas = list(set([r['ua'] for r in reqs]))
    
    matched_user = next((u for u in registered_users if u['ip'] == ip), None)
    matched_events = [e for e in track_events if e['ip'] == ip or (matched_user and e['user_id'] == matched_user['id'])]
    
    survey_submitted = any(e['event_name'] == 'onboarding_survey_submitted' for e in matched_events)
    visited_pricing = any('pricing' in p for p in key_pages)
    visited_wallet = any('wallet' in p or 'topup' in p for p in key_pages)
    visited_signup = any('sign-up' in p or 'register' in p for p in key_pages)
    token_created = any(e['event_name'] == 'token_created' for e in matched_events)
    payment_clicked = any('click_payment' in e['event_name'] or 'select_pay_tier' in e['event_name'] for e in matched_events)
    
    intent = "LOW"
    intent_desc = []
    if payment_clicked:
        intent = "VERY HIGH"
        intent_desc.append("Clicked payment tiers/method")
    elif visited_wallet:
        intent = "HIGH"
        intent_desc.append("Accessed wallet top-up")
    elif token_created:
        intent = "HIGH"
        intent_desc.append("Created API key")
    elif matched_user:
        intent = "HIGH"
        intent_desc.append("Completed Google/Email sign up")
    elif visited_signup:
        intent = "MEDIUM-HIGH"
        intent_desc.append("Reached sign-up page")
    elif visited_pricing:
        intent = "MEDIUM"
        intent_desc.append("Inspected pricing comparison")
    else:
        intent_desc.append("Browsed blog / landing page only")
        
    sessions.append({
        'ip': ip,
        'is_in_24h': is_in_24h,
        'first_dt': first_dt,
        'last_dt': last_dt,
        'first_seen': first_dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'last_seen': last_dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'dwell_seconds': dwell,
        'req_count': len(reqs),
        'geo': geo,
        'referrers': referrers if referrers else ["Direct / None"],
        'ua': uas[0] if uas else "",
        'trajectory': key_pages,
        'matched_user': matched_user,
        'matched_events': matched_events,
        'survey_submitted': survey_submitted,
        'intent': intent,
        'intent_desc': intent_desc
    })

sessions.sort(key=lambda x: x['first_dt'], reverse=True)

# Separate 24h vs 36h
s_24h = [s for s in sessions if s['is_in_24h']]
s_prior = [s for s in sessions if not s['is_in_24h']]

print(f"\n=======================================================")
print(f"=== STRICT 24-HOUR REAL HUMAN VISITORS ({len(s_24h)} visitors) ===")
print(f"=======================================================\n")

for idx, s in enumerate(s_24h, 1):
    dwell_str = f"{int(s['dwell_seconds'])}s" if s['dwell_seconds'] < 60 else f"{int(s['dwell_seconds']//60)}m {int(s['dwell_seconds']%60)}s"
    print(f"Visitor 24H-#{idx}: IP {s['ip']}")
    print(f"  Country / City: {s['geo']['country']} ({s['geo']['city']}) | ISP: {s['geo']['isp']}")
    print(f"  First Visit: {s['first_seen']} | Last Visit: {s['last_seen']} | Dwell: {dwell_str} | Requests: {s['req_count']}")
    print(f"  Source/Referrer: {', '.join(s['referrers'])}")
    print(f"  User Agent: {s['ua']}")
    print(f"  Trajectory ({len(s['trajectory'])} steps): {' -> '.join(s['trajectory'][:8])}")
    print(f"  Survey Completed: {'YES' if s['survey_submitted'] else 'NO'}")
    print(f"  Payment Conversion Intent: {s['intent']} ({', '.join(s['intent_desc'])})")
    if s['matched_user']:
        print(f"  Registered User: User ID {s['matched_user']['id']}, Email: {s['matched_user']['email']}, Reg Time: {s['matched_user']['created_at']}")
    if s['matched_events']:
        print(f"  Track Events: {[e['event_name'] for e in s['matched_events']]}")
    print("-" * 75)

if s_prior:
    print(f"\n=======================================================")
    print(f"=== PRECEDING 24~36H REAL HUMAN VISITORS ({len(s_prior)} visitors) ===")
    print(f"=======================================================\n")
    for idx, s in enumerate(s_prior, 1):
        dwell_str = f"{int(s['dwell_seconds'])}s" if s['dwell_seconds'] < 60 else f"{int(s['dwell_seconds']//60)}m {int(s['dwell_seconds']%60)}s"
        print(f"Visitor Prior-#{idx}: IP {s['ip']}")
        print(f"  Country / City: {s['geo']['country']} ({s['geo']['city']}) | ISP: {s['geo']['isp']}")
        print(f"  First Visit: {s['first_seen']} | Dwell: {dwell_str} | Requests: {s['req_count']}")
        print(f"  Source/Referrer: {', '.join(s['referrers'])}")
        print(f"  Trajectory: {' -> '.join(s['trajectory'][:8])}")
        print(f"  Survey Completed: {'YES' if s['survey_submitted'] else 'NO'}")
        print(f"  Payment Conversion Intent: {s['intent']} ({', '.join(s['intent_desc'])})")
        if s['matched_user']:
            print(f"  Registered User: User ID {s['matched_user']['id']}, Email: {s['matched_user']['email']}, Reg Time: {s['matched_user']['created_at']}")
        if s['matched_events']:
            print(f"  Track Events: {[e['event_name'] for e in s['matched_events']]}")
        print("-" * 75)

# Save result to JSON
with open('/root/final_visitor_analysis.json', 'w', encoding='utf-8') as f:
    # Convert datetimes to strings
    for s in sessions:
        s['first_dt'] = s['first_dt'].isoformat()
        s['last_dt'] = s['last_dt'].isoformat()
    json.dump({'window_utc': [h24_ago.isoformat(), now_utc.isoformat()], 'visitors_24h': s_24h, 'visitors_prior_36h': s_prior}, f, ensure_ascii=False, indent=2)

print("\nAnalysis finished and exported to /root/final_visitor_analysis.json")
