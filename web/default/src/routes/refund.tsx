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

function RefundPolicyPage() {
  useEffect(() => {
    document.title = 'Refund Policy | APIVEL'
  }, [])

  return (
    <PublicLayout>
      <PageTransition className='mx-auto max-w-4xl py-12 px-4'>
        <div className='border-border/30 bg-muted/15 rounded-2xl border p-8 backdrop-blur-sm space-y-6'>
          <h1 className='text-3xl font-extrabold tracking-tight'>Refund Policy</h1>
          <p className='text-muted-foreground text-xs'>Last Updated: June 2, 2026</p>
          
          <div className='prose prose-neutral dark:prose-invert max-w-none text-sm text-muted-foreground space-y-6 leading-relaxed'>
            <p>
              At APIVEL, we strive to provide reliable and highly optimized API gateway services. Because we aggregate paid resources from upstream providers in real-time, our billing policy is structured around transparent usage parameters. This Refund Policy describes the conditions under which you may request a refund for our services.
            </p>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>1. Subscription Refunds</h2>
              <p>
                For our paid recurring plans (such as Developer and Pro packages):
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Initial Purchase:</strong> You may request a full refund of your initial subscription fee within <strong>seven (7) days</strong> of purchase, provided that you have not materially used the Service (e.g., you have consumed less than $1 in API request value or equivalent tokens since signing up).</li>
                <li><strong>Renewals:</strong> Monthly renewals are processed automatically to maintain active rate limits, fallback channels, and dashboard access. Renewals are generally non-refundable once the billing period has begun.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>2. API Usage Credits</h2>
              <p>
                For prepaid pay-as-you-go usage credits:
              </p>
              <ul className='list-disc pl-5 space-y-1.5'>
                <li><strong>Consumed Credits:</strong> Once API requests have been processed by our gateway and routed to upstream models, the corresponding token usage credit is consumed and is <strong>strictly non-refundable</strong>. We pay upstream model providers for every request processed, so we cannot refund consumed units.</li>
                <li><strong>Unused Balance:</strong> If you purchased prepaid usage credits in error and have not consumed any tokens, you may contact support@apivel.com within seven (7) days of purchase to request a refund of the unused balance, reviewed case by case.</li>
              </ul>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>3. Subscription Cancellations</h2>
              <p>
                You may cancel your monthly plan renewal at any time. Cancellations can be handled directly through your developer dashboard, or by contacting our billing support team via email at <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>. Upon cancellation, your subscription features will remain active until the end of the current billing cycle, and no further renewal charges will be made.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>4. Billing Issues and Discrepancies</h2>
              <p>
                If you detect double charges, accidental purchases, or invoice discrepancies, please reach out immediately to <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a> with your account email and transaction ID. We will investigate and process valid corrections promptly.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>5. Policy Violations and Suspensions</h2>
              <p>
                Accounts that are suspended or permanently terminated due to violations of our <Link to='/terms' className='text-blue-500 hover:underline'>Terms of Service</Link> or our <Link to='/acceptable-use' className='text-blue-500 hover:underline'>Acceptable Use Policy</Link> are <strong>strictly ineligible</strong> for refunds of any unused subscriptions or remaining usage credits.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>6. Legal Rights</h2>
              <p>
                This Refund Policy does not limit, restrict, or override any mandatory refund rights or consumer guarantees required under applicable local laws in your operating region.
              </p>
            </section>

            <section className='space-y-2.5'>
              <h2 className='text-lg font-bold text-foreground'>7. Requesting a Refund</h2>
              <p>
                To request a refund review under this policy, please submit an email request to our support desk:
                <br />
                <strong>Email:</strong> <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>
                <br />
                <strong>Subject Line:</strong> Refund Request - [Your Developer Account Email]
                <br />
                <strong>Required Details:</strong> Account username, checkout invoice number, date of transaction, and reason for the refund request.
              </p>
            </section>
          </div>
        </div>
      </PageTransition>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/refund')({
  component: RefundPolicyPage,
})
