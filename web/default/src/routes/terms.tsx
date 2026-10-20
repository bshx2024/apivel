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
import { Link, createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'

function TermsOfServicePage() {
  useEffect(() => {
    document.title = 'Terms of Service | APIVEL'
  }, [])

  return (
    <PublicLayout>
      <PageTransition className='mx-auto max-w-4xl py-12 px-4'>
        <div className='border-border/30 bg-muted/15 rounded-2xl border p-8 backdrop-blur-sm space-y-6'>
          <h1 className='text-3xl font-extrabold tracking-tight'>Terms of Service</h1>
          <p className='text-muted-foreground text-xs'>Last Updated: June 2, 2026</p>
          
          <div className='prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground space-y-6 leading-relaxed'>
            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>1. Acceptance of Terms</h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Customer", or "Developer") and Astrapix LLC ("Company", "we", "us", or "APIVEL"), governing your access to and use of the APIVEL platform, API gateway, documentation, client libraries, and developer dashboard (collectively, the "Service").
              </p>
              <p>
                By registering for an account, generating an API key, or making API calls through the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our related policies (including our <Link to='/privacy' className='text-blue-500 hover:underline'>Privacy Policy</Link>, <Link to='/refund' className='text-blue-500 hover:underline'>Refund Policy</Link>, and <Link to='/acceptable-use' className='text-blue-500 hover:underline'>Acceptable Use Policy</Link>). If you represent an organization, you represent and warrant that you possess full corporate authority to bind that entity. If you do not agree, do not access or use the Service.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>2. Description of Service & Aggregator Role</h2>
              <p>
                APIVEL operates a high-performance, developer-focused large language model (LLM) API gateway and aggregator. The Service enables users to route requests across third-party artificial intelligence models and providers (e.g., DeepSeek, Alibaba Qwen, Zhipu GLM, Moonshot Kimi, Anthropic, and OpenAI) through a unified, OpenAI-compatible endpoint with intelligent failover, load balancing, and token-based usage billing.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>3. Eligibility & Account Security</h2>
              <p>
                You must be at least eighteen (18) years of age (or the legal age of majority in your jurisdiction) and possess full legal capacity to enter into these Terms. You agree to provide accurate, current, and complete registration information. You are solely responsible for safeguarding your account credentials, passwords, and generated API keys. You are fully responsible for all activity and billing charges incurred under your account or API credentials, whether authorized by you or not. You must notify support@apivel.com immediately of any suspected security compromise or unauthorized access.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>4. API Access, Keys & Usage Constraints</h2>
              <p>
                We grant you a non-exclusive, non-transferable, revocable right to access the API gateway subject to these Terms:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Credential Security:</strong> Do not hardcode API keys into publicly accessible client-side code, public GitHub repositories, or untrusted environments.</li>
                <li><strong>Rate Limits & Concurrency:</strong> You must comply with rate limits (requests per minute/RPM, tokens per minute/TPM) and concurrency caps assigned to your tier. Circumventing limits via automated key pooling or distributed sybil accounts is a material breach.</li>
                <li><strong>Downstream Responsibility:</strong> You are solely responsible for all applications, software, and microservices you build or deploy using our API gateway.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>5. Pricing, Billing & Nature of Pre-Paid Credits</h2>
              <p>
                Access to AI model routing requires the purchase of prepaid usage credits or recurring subscription plans:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Nature of Credits:</strong> Prepaid credits are not legal tender, do not possess equivalent value in fiat currency, do not act as money substitutes, and do not confer any personal property or financial asset rights. Credits are non-transferable between accounts and may only be consumed to route requests through the Service.</li>
                <li><strong>Consumption:</strong> Prepaid usage credits are consumed dynamically in real-time as requests are processed by the gateway and routed to upstream models. Once consumed, credits are strictly non-refundable.</li>
                <li><strong>Subscriptions:</strong> Monthly developer tiers auto-renew at the start of each billing cycle unless cancelled. You can cancel future renewals at any time from your developer dashboard.</li>
                <li><strong>Promotional Credits:</strong> Trial or promotional credits have no cash value, are non-refundable, non-transferable, and expire as designated at the time of issuance.</li>
                <li><strong>Payment Processors:</strong> Transactions are securely processed through verified third-party payment providers (such as PayPal and authorized international credit card gateways). All prices are exclusive of applicable local taxes, VAT, or conversion fees.</li>
                <li><strong>Refunds:</strong> All refund requests are governed exclusively by our <Link to='/refund' className='text-blue-500 hover:underline'>Refund Policy</Link>.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>6. Model Terms Pass-Through & Availability</h2>
              <p>
                <strong>Downstream Flow-Down:</strong> The Service routes requests to third-party model providers. By accessing any model via the Service, you and your downstream customers/end-users agree to comply with the applicable terms of service, usage policies, and license terms established by each respective Model Provider.
              </p>
              <p>
                <strong>As-Available Basis:</strong> APIVEL provides model access strictly on an "as-available" basis. Upstream providers may modify, deprecate, rate-limit, or take models offline without prior notice. APIVEL does not guarantee continuous uptime or uninterrupted availability of any specific model or provider channel.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>7. Restricted Models & Anti-Circumvention</h2>
              <p>
                Certain model providers enforce regional, entity, or legal access restrictions on specific models ("Restricted Models"). You agree not to, and will not permit downstream users to, use the Service in conjunction with unauthorized proxies, VPNs, or circumvention tools to bypass geographic or compliance safeguards implemented by APIVEL or upstream model providers. Any breach of this section constitutes grounds for immediate account termination without refund.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>8. User Content, Data Privacy & Zero Model Training</h2>
              <p>
                <strong>Ownership:</strong> You retain all intellectual property rights and ownership in the prompts, inputs, text, images, and work you submit to the Service ("Inputs"). Ownership and usage rights in generated outputs ("Outputs") are determined by the applicable upstream Model Provider's terms.
              </p>
              <p>
                <strong>Limited License:</strong> You grant APIVEL a worldwide, royalty-free license strictly to host, cache in memory, format, and transmit your Inputs and Outputs as necessary to execute API routing and fulfill requests.
              </p>
              <p>
                <strong>No AI Model Training:</strong> APIVEL operates strictly as an API proxy and gateway. We do <strong>not</strong> log, store, sell, or disclose your proprietary prompts, code, or generated responses to train, fine-tune, or improve any machine learning or artificial intelligence models.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>9. AI Output Disclaimers & Non-Determinism</h2>
              <p>
                You acknowledge that artificial intelligence model outputs are probabilistic, non-deterministic, and may occasionally generate inaccurate, incomplete, or offensive outputs (often referred to as "hallucinations"). You are solely responsible for evaluating, reviewing, and verifying the accuracy, quality, and legal compliance of all Outputs before deploying or incorporating them into production workflows or consumer-facing applications.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>10. Acceptable Use & Prohibited Content</h2>
              <p>
                You agree not to use the Service for any unlawful, abusive, or harmful purpose. We strictly prohibit: (a) Child Sexual Abuse Material (CSAM) and child exploitation under zero tolerance; (b) Pornography, sexually explicit content, and non-consensual adult imagery/audio (NSFW); (c) Hate speech, harassment, defamation, and discrimination; (d) Violence, terrorism, self-harm, or dangerous activities; (e) Deceptive media, non-consensual voice cloning, deepfakes, and fraud; and (f) Intellectual property infringement, malware, and cyberattacks. Review our comprehensive <Link to='/acceptable-use' className='text-blue-500 hover:underline'>Acceptable Use Policy</Link> for detailed rules, moderation mechanisms, and reporting procedures.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>11. Intellectual Property</h2>
              <p>
                All rights, titles, and interests in the APIVEL platform, routing infrastructure, dashboard UI, documentation, logos, and trademarks remain the exclusive property of APIVEL (and where applicable, its project contributors and licensors).
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>12. Suspension and Termination</h2>
              <p>
                We reserve the right to suspend, restrict, or terminate your developer account and API key access immediately, with or without notice, if you violate these Terms, breach our Acceptable Use Policy, fail to maintain positive billing balances, or engage in behavior that threatens the security, integrity, or stability of the platform.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>13. Disclaimers of Warranties & Force Majeure</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE GATEWAY WILL BE ERROR-FREE, UNINTERRUPTED, OR TIMELY.
              </p>
              <p>
                APIVEL shall not be liable for any failure or delay in performance resulting from causes beyond reasonable control, including internet backbone outages, submarine cable disruptions, third-party cloud infrastructure failures (e.g., AWS, Cloudflare), upstream AI vendor downtime, cyberattacks, or government regulatory actions.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>14. Limitation of Liability & Maximum Cap</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL APIVEL, ITS DIRECTORS, OFFICERS, EMPLOYEES, OR CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION), EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES PAID BY YOU TO APIVEL IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED UNITED STATES DOLLARS ($100 USD).
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>15. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless APIVEL, its parent, affiliates, directors, officers, and contributors from and against any third-party claims, damages, liabilities, losses, costs, and legal fees arising out of or related to: (a) your use of the Service; (b) your Inputs, Outputs, or downstream applications; (c) your violation of these Terms or applicable upstream Model Terms; or (d) your infringement of any third-party rights.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>16. Class Action Waiver & Governing Law</h2>
              <p>
                <strong>Class Action Waiver:</strong> ALL DISPUTES, CLAIMS, AND CONTROVERSIES ARISING OUT OF OR RELATING TO THESE TERMS MUST BE RESOLVED ON AN INDIVIDUAL BASIS. YOU EXPRESSLY WAIVE ANY RIGHT TO COMMENCE, JOIN, OR PARTICIPATE AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS ACTION, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING.
              </p>
              <p>
                <strong>Governing Law & Jurisdiction:</strong> These Terms shall be governed by and construed in accordance with the laws of the People's Republic of China (PRC), without regard to conflict of law principles. Any dispute arising out of or in connection with these Terms shall be submitted exclusively to the competent courts of Beijing, China.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>17. Export Controls & Trade Sanctions</h2>
              <p>
                You represent and warrant that you and your end-users are not located in, organized under the laws of, or resident in any country or territory subject to comprehensive international trade sanctions or embargoes, and are not listed on any applicable restricted party or sanctions lists.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>18. Changes to Terms</h2>
              <p>
                We reserve the right to revise or update these Terms from time to time. We will indicate the "Last Updated" date at the top of this document. Your continued access to or use of the Service following published modifications constitutes your binding acceptance of the revised Terms.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>19. Contact & Entity Information</h2>
              <p>
                The Service is operated by <strong>Astrapix LLC</strong>.
                <br />
                For legal inquiries, terms clarifications, or enterprise agreement requests, please contact our team via email at <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>.
              </p>
            </section>
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/terms')({
  component: TermsOfServicePage,
})
