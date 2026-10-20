/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'

function AcceptableUsePolicyPage() {
  useEffect(() => {
    document.title = 'Acceptable Use Policy | APIVEL'
  }, [])

  return (
    <PublicLayout>
      <PageTransition className='mx-auto max-w-4xl py-12 px-4'>
        <div className='border-border/30 bg-muted/15 rounded-2xl border p-8 backdrop-blur-sm space-y-6'>
          <h1 className='text-3xl font-extrabold tracking-tight'>Acceptable Use Policy</h1>
          <p className='text-muted-foreground text-xs'>Last Updated: June 2, 2026</p>
          
          <div className='prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground space-y-6 leading-relaxed'>
            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>1. Purpose & Scope</h2>
              <p>
                APIVEL provides developer access to high-performance artificial intelligence model APIs, including large language models (LLMs), multimodal processors, image/video synthesis, and Text-to-Speech (TTS) / voice synthesis capabilities.
              </p>
              <p>
                To maintain platform safety, uphold strict legal compliance, and prevent misuse of generative AI technologies, all users, developers, applications, and downstream consumers accessing our API gateway must strictly adhere to this Acceptable Use Policy (AUP).
              </p>
            </section>

            <section className='space-y-3'>
              <h2 className='text-lg font-bold text-foreground'>2. Prohibited Content Categories</h2>
              <p>
                You may not use the APIVEL platform, API endpoints, or services to generate, process, upload, transmit, or distribute content falling into any of the following six prohibited categories:
              </p>

              <div className='space-y-4 pl-2'>
                <div className='border-l-2 border-red-500/60 pl-3.5 space-y-1'>
                  <h3 className='font-semibold text-foreground text-sm'>A. Child Sexual Abuse Material (CSAM) & Child Exploitation — Zero Tolerance</h3>
                  <p className='text-xs'>
                    Any content involving, depicting, promoting, or facilitating Child Sexual Abuse Material (CSAM), Child Sexual Exploitation and Abuse (CSAE), child grooming, or harm to minors is strictly prohibited. We maintain an absolute zero-tolerance policy for child exploitation. Any detected violations will result in immediate permanent account termination, IP ban, and mandatory reporting to law enforcement authorities and the National Center for Missing & Exploited Children (NCMEC).
                  </p>
                </div>

                <div className='border-l-2 border-amber-500/60 pl-3.5 space-y-1'>
                  <h3 className='font-semibold text-foreground text-sm'>B. Pornography, Explicit Adult Content & Non-Consensual Sexual Content (NSFW)</h3>
                  <p className='text-xs'>
                    Generating sexually explicit content, pornography, erotica, non-consensual sexual imagery (NCII), deepfake sexual depictions, or explicit adult audio/text/visual material (NSFW) is strictly forbidden across all API endpoints.
                  </p>
                </div>

                <div className='border-l-2 border-border pl-3.5 space-y-1'>
                  <h3 className='font-semibold text-foreground text-sm'>C. Hate Speech, Harassment, Defamation & Discrimination</h3>
                  <p className='text-xs'>
                    Content that promotes hatred, inciteful hostility, discrimination, harassment, stalking, bullying, slurs, or disparagement based on race, ethnicity, nationality, religion, disability, gender, gender identity, or sexual orientation is strictly prohibited.
                  </p>
                </div>

                <div className='border-l-2 border-border pl-3.5 space-y-1'>
                  <h3 className='font-semibold text-foreground text-sm'>D. Violence, Self-Harm, Terrorism & Dangerous Activities</h3>
                  <p className='text-xs'>
                    Content that depicts, glorifies, or promotes graphic violence, physical injury, self-harm, suicide, eating disorders, terrorism, violent extremism, weapons of mass destruction, or provides actionable instructions on dangerous or illegal activities is strictly prohibited.
                  </p>
                </div>

                <div className='border-l-2 border-border pl-3.5 space-y-1'>
                  <h3 className='font-semibold text-foreground text-sm'>E. Deceptive Media, Non-Consensual Voice Cloning, Deepfakes & Fraud</h3>
                  <p className='text-xs'>
                    Generating deceptive synthetic media ("deepfakes"), unauthorized voice cloning without explicit prior written consent, synthetic identity fraud, impersonation of individuals or official organizations, phishing schemes, financial scams, or spreading deliberate disinformation is strictly prohibited.
                  </p>
                </div>

                <div className='border-l-2 border-border pl-3.5 space-y-1'>
                  <h3 className='font-semibold text-foreground text-sm'>F. Intellectual Property Infringement, Malware & Cyberattacks</h3>
                  <p className='text-xs'>
                    Content that infringes third-party copyrights, trademarks, patents, or trade secrets. Utilizing the API to develop, test, or distribute computer viruses, ransomware, phishing generators, exploit payloads, automated DDoS tools, or credentials cracking utilities is strictly prohibited.
                  </p>
                </div>
              </div>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>3. Text-to-Speech (TTS) & Audio Generation Standards</h2>
              <p>
                When utilizing TTS, voice cloning, or audio generation models through APIVEL:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li>You must have explicit, demonstrable consent and authorization from any speaker before synthesizing or cloning their voice.</li>
                <li>You may not generate synthetic audio intended to deceive listeners about the caller's identity (e.g., automated fraud calls, synthetic CEO fraud, or emergency impersonation).</li>
                <li>You may not use TTS models to generate defamatory, abusive, or non-consensual sexually suggestive audio.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>4. Content Moderation & Automated Safety Mechanisms</h2>
              <p>
                APIVEL implements a comprehensive, multi-layered approach to content moderation and platform safety:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Upstream Model Safety Alignment:</strong> Upstream model providers enforce native safety alignment, prompt evaluation filters, and RLHF guardrails to detect and block unsafe prompts.</li>
                <li><strong>Gateway Heuristic Screening:</strong> We deploy automated pattern matching, rate anomaly detection, and keyword/regex filters to intercept known malicious payloads, spam patterns, and abuse scripts in real time.</li>
                <li><strong>Automated & Human Review:</strong> Traffic patterns exhibiting abnormal spikes, high rejection rates, or flagged signatures are routed for immediate review by our compliance team.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>5. Enforcement & Penalties</h2>
              <p>
                We enforce compliance through immediate and progressive enforcement actions:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Immediate Revocation:</strong> API keys utilized for prohibited activities will be suspended or permanently revoked immediately without prior notice.</li>
                <li><strong>Account Termination:</strong> Serious or repeat violations result in permanent account termination and forfeiture of remaining usage credits.</li>
                <li><strong>Legal & Regulatory Escalation:</strong> In cases involving CSAM, terrorism, cyberattacks, or severe fraud, APIVEL cooperates fully with international law enforcement authorities and reports offender credentials and IP logs.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>6. Reporting Violations & Rapid Response</h2>
              <p>
                We maintain an active, monitored channel for abuse reports. If you discover any application, developer, or endpoint misusing our services to generate prohibited content:
                <br />
                <strong>Abuse & Compliance Email:</strong> <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>
                <br />
                <strong>Response Commitment:</strong> Reports are prioritized and reviewed by our security team, with preliminary investigation and takedown actions initiated within <strong>24 hours</strong>.
              </p>
            </section>
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/acceptable-use')({
  component: AcceptableUsePolicyPage,
})
