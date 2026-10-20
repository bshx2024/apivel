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

function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | APIVEL'
  }, [])

  return (
    <PublicLayout>
      <PageTransition className='mx-auto max-w-4xl py-12 px-4'>
        <div className='border-border/30 bg-muted/15 rounded-2xl border p-8 backdrop-blur-sm space-y-6'>
          <h1 className='text-3xl font-extrabold tracking-tight'>Privacy Policy</h1>
          <p className='text-muted-foreground text-xs'>Last Updated: June 2, 2026</p>
          
          <div className='prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground space-y-6 leading-relaxed'>
            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>1. Introduction & Operating Entity</h2>
              <p>
                Astrapix LLC (operating "APIVEL", "we", "us", or "our") respects your privacy and is dedicated to safeguarding your personal data. This Privacy Policy informs you of our practices regarding the collection, processing, transmission, storage, and disclosure of data when you access our API gateway services, developer dashboard, client libraries, documentation, and official website (collectively, the "Service").
              </p>
              <p>
                By accessing or using the Service, you acknowledge that you have read and understood the practices described in this Privacy Policy and our <Link to='/terms' className='text-blue-500 hover:underline'>Terms of Service</Link>.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>2. Information We Collect</h2>
              <p>We may collect and process the following categories of data:</p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Account Information:</strong> Email address, username, hashed passwords, authentication tokens, and profile data provided when you register or authenticate through third-party OAuth providers (e.g., GitHub, Google).</li>
                <li><strong>Billing & Transactional Data:</strong> Order records, transaction timestamps, credit purchase history, and payment status. Financial transactions are securely processed directly by our authorized payment gateways (e.g., PayPal and certified international card processors); we do not store full payment card numbers on our servers.</li>
                <li><strong>API Telemetry & Usage Data:</strong> Gateway routing records, requested model names, token consumption tallies (prompt tokens, completion tokens), latency metrics, HTTP status codes, and execution timestamps.</li>
                <li><strong>Technical & Device Data:</strong> IP address, device type, browser characteristics, operating system, and security logs used to protect against DDoS attacks and abusive scraping.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>3. How We Use Your Information</h2>
              <p>We process collected data exclusively for legitimate business and operational purposes:</p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li>To provide, route, optimize, and maintain our high-concurrency API gateway and developer dashboard.</li>
                <li>To generate, validate, and manage developer API keys and role-based permissions.</li>
                <li>To meter token consumption dynamically and bill usage accurately against prepaid credits or developer subscriptions.</li>
                <li>To detect, prevent, and mitigate security incidents, fraudulent transactions, spam, and violations of our Acceptable Use Policy.</li>
                <li>To provide customer support, respond to technical inquiries, and send critical service announcements.</li>
                <li>To comply with applicable legal and regulatory obligations.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>4. API Request Data, Transmissions & Zero Model Training</h2>
              <p>
                <strong>Routing & Transmissions:</strong> When you invoke our API endpoints, your request inputs, prompts, messages, and parameters ("Inputs") are transmitted in real time to the upstream Model Provider (such as DeepSeek, Alibaba Qwen, Zhipu GLM, Moonshot Kimi, Anthropic, or OpenAI) selected by your request header or automatic fallback rules to generate output responses ("Outputs").
              </p>
              <p>
                <strong>Zero AI Model Training:</strong> APIVEL operates strictly as an infrastructure routing proxy and gateway. We do <strong>not</strong> use, store, harvest, or disclose your proprietary Inputs, prompts, code snippets, or generated Outputs to train, fine-tune, or evaluate any artificial intelligence or machine learning models.
              </p>
              <p>
                <strong>Ephemeral In-Memory Processing:</strong> API request payloads are processed ephemerally in memory to fulfill routing. Short-term caching is utilized solely as necessary to enable streaming, retry logic, rate limiting, and temporary error diagnostics.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>5. Multimodal & Biometric Data Processing</h2>
              <p>
                Certain upstream models support multimodal capabilities, including image generation/analysis, voice cloning, audio transcription, or video processing. If you submit image, audio, or video files containing depictions, voice samples, or identifiable characteristics of individuals:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li>You represent and warrant that you have obtained all necessary prior informed notices and consents from any identifiable individual as required under applicable privacy and biometric laws (e.g., GDPR, CCPA/CPRA, Illinois BIPA).</li>
                <li>APIVEL acts solely as a technical conduit, passing multimodal data to the designated model provider for inference, and does not independently harvest, store, or create biometric identifier templates.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>6. Third-Party Service Providers</h2>
              <p>
                We collaborate with reputable service providers to deliver platform capabilities:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Payment Processors:</strong> We partner with certified global payment gateways (including PayPal and international credit card processors) to handle billing securely.</li>
                <li><strong>Infrastructure & Security:</strong> We deploy robust cloud infrastructure, database clusters, and CDN/DDoS mitigation networks (e.g., Cloudflare) to ensure 24/7 gateway availability and low latency.</li>
              </ul>
              <p>
                All third-party vendors are bound by strict confidentiality obligations and are prohibited from using your data for any unauthorized purpose.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>7. Cookies and Tracking Technologies</h2>
              <p>
                We use strictly necessary and functional cookies to maintain authenticated sessions, secure user accounts, and remember dashboard preferences (such as dark/light UI themes). We do not use intrusive third-party cross-site behavioral tracking cookies, and we do not sell your browsing data to advertisers. You can configure your browser to block cookies, though certain dashboard features may be impaired.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>8. Data Retention & Account Deletion</h2>
              <p>
                We retain account credentials and billing records for as long as your account remains active or as required by financial, tax, and legal obligations. Transient gateway request logs are periodically pruned to uphold data minimization principles.
              </p>
              <p>
                <strong>Account Deletion:</strong> You may request permanent deletion of your account and associated personal data at any time by emailing us at <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>. Upon confirmation, your account and identifiable records will be permanently purged, except where retention is legally mandated.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>9. International Data Transfers</h2>
              <p>
                To provide high-availability AI routing, your data may be processed through distributed edge nodes and data centers located globally. We take reasonable measures to ensure that cross-border data transfers comply with international data protection standards and standard contractual safeguards.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>10. Your Privacy Rights (GDPR & CCPA/CPRA)</h2>
              <p>
                Depending on your jurisdiction (including the European Economic Area, UK, and California), you may have the following statutory rights regarding your personal data:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Right to Know & Access:</strong> The right to request information about the categories and specific pieces of personal data we hold about you.</li>
                <li><strong>Right to Rectification:</strong> The right to correct inaccurate or outdated information in your profile.</li>
                <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> The right to request deletion of your personal data.</li>
                <li><strong>Right to Restrict & Object:</strong> The right to restrict or object to certain processing activities.</li>
                <li><strong>Right to Data Portability:</strong> The right to receive your personal data in a structured, commonly used format.</li>
                <li><strong>Non-Sale of Personal Data:</strong> We do <strong>not</strong> sell your personal data or trade your information for monetary or other valuable consideration.</li>
              </ul>
              <p>
                To exercise any of these rights, contact us at <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>11. Data Security</h2>
              <p>
                We employ comprehensive technical and organizational safeguards—including industry-standard TLS 1.3 encryption in transit, strict database access controls, encrypted token stores, and continuous perimeter monitoring—to protect your personal information against unauthorized access, alteration, or disclosure.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>12. Children's Privacy</h2>
              <p>
                The Service is strictly intended for developers and commercial entities. We do not knowingly collect personal information from individuals under eighteen (18) years of age. If we learn that a minor has created an account, we will promptly delete the data.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>13. Changes to This Privacy Policy</h2>
              <p>
                We may revise this Privacy Policy periodically to reflect technological updates, regulatory changes, or enhancements to our Service. Changes will be posted to this page with an updated "Last Updated" timestamp. Continued use of the Service after modifications signifies your acceptance of the updated terms.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>14. Contact & Data Protection Inquiries</h2>
              <p>
                The Service is operated by <strong>Astrapix LLC</strong>.
                <br />
                For any privacy questions, Data Processing Agreement (DPA) requests, or data subject access requests, please contact our compliance team at <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>.
              </p>
            </section>
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicyPage,
})
