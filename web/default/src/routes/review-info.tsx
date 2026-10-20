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
import { ShieldCheck, Info, FileText, Mail, HelpCircle, ArrowRight } from 'lucide-react'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'

function ReviewInfoPage() {
  useEffect(() => {
    document.title = 'Business Review Info | APIVEL'
  }, [])

  return (
    <PublicLayout>
      <PageTransition className='mx-auto max-w-4xl py-12 px-4 space-y-10'>
        
        {/* Header Section */}
        <div className='text-center space-y-3 max-w-2xl mx-auto'>
          <div className='inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500 backdrop-blur-sm'>
            Audit & Compliance
          </div>
          <h1 className='text-3xl font-extrabold tracking-tight sm:text-4xl'>APIVEL Business Review Information</h1>
          <p className='text-muted-foreground text-sm sm:text-base leading-relaxed'>
            Commercial disclosures, product identity, and operational policies for merchant review and payment gateway audits.
          </p>
        </div>

        {/* Merchant & Tech Relationship Disclosure Banner */}
        <div className='border-blue-500/20 bg-blue-500/5 rounded-2xl border p-6 max-w-3xl mx-auto space-y-2 text-xs text-muted-foreground/90 leading-relaxed shadow-sm'>
          <p>
            <strong>APIVEL</strong> (operated by Astrapix LLC) is the commercial SaaS operator and merchant-facing brand for the hosted API gateway service provided at <a href="https://apivel.com" className="text-blue-500 font-medium hover:underline">apivel.com</a>. The service may use or build upon open-source gateway components, and the footer includes required open-source attribution for the underlying technical foundation. Customer accounts, billing, support, legal policies, and hosted service delivery are operated under APIVEL.
          </p>
        </div>

        {/* Info Grid */}
        <div className='grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto'>
          {/* Card 1: Merchant & Product Identity */}
          <div className='border-border/30 bg-muted/15 rounded-xl border p-6 backdrop-blur-sm space-y-4'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-blue-500/10 rounded-lg p-2'>
                <Info className='size-5 text-blue-500' />
              </div>
              <h3 className='text-sm font-bold tracking-tight'>Product & Service Identity</h3>
            </div>
            <ul className='space-y-2 text-xs text-muted-foreground leading-relaxed'>
              <li><strong>Product Name:</strong> APIVEL</li>
              <li><strong>Product Type:</strong> SaaS / API platform</li>
              <li><strong>Operating Entity:</strong> Astrapix LLC</li>
              <li><strong>What We Sell:</strong> Paid access to an OpenAI-compatible AI model gateway</li>
              <li><strong>Product Status:</strong> APIVEL is live for approved developers. Some model families and higher usage limits may require approval.</li>
            </ul>
          </div>

          {/* Card 2: Commercial Delivery Method */}
          <div className='border-border/30 bg-muted/15 rounded-xl border p-6 backdrop-blur-sm space-y-4'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-blue-500/10 rounded-lg p-2'>
                <ShieldCheck className='size-5 text-blue-500' />
              </div>
              <h3 className='text-sm font-bold tracking-tight'>Access & Delivery Model</h3>
            </div>
            <ul className='space-y-2 text-xs text-muted-foreground leading-relaxed'>
              <li><strong>Delivery Method:</strong> dashboard, API keys, documentation, usage tracking</li>
              <li><strong>Delivery Flow:</strong> Instantly delivered via our secure automated SaaS dashboard.</li>
              <li><strong>Customer Journey:</strong>
                <ol className='list-decimal pl-4 mt-1 space-y-1'>
                  <li>Register a developer account instantly.</li>
                  <li>Subscribe to a monthly plan or purchase initial usage credits securely at checkout.</li>
                  <li>Generate secure, custom API keys instantly.</li>
                  <li>Direct developer requests through our secure base endpoint.</li>
                </ol>
              </li>
            </ul>
          </div>

          {/* Card 3: Subscription & Quota Structures */}
          <div className='border-border/30 bg-muted/15 rounded-xl border p-6 backdrop-blur-sm space-y-4'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-blue-500/10 rounded-lg p-2'>
                <FileText className='size-5 text-blue-500' />
              </div>
              <h3 className='text-sm font-bold tracking-tight'>Pricing, Billing & Credits</h3>
            </div>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              Customers pay for gateway resources through two commercial structures:
            </p>
            <ul className='list-disc pl-4 space-y-1 text-xs text-muted-foreground leading-relaxed'>
              <li><strong>Monthly Developer Plans:</strong> Developer ($19/mo) and Pro ($49/mo) subscriptions provide dashboard access, standard usage quotas, rate limits, and priority email support.</li>
              <li><strong>Usage Credits:</strong> Real-time consumption based on the precise volume of tokens processed by the gateway at published model rates.</li>
            </ul>
          </div>

          {/* Card 4: Support & Operations */}
          <div className='border-border/30 bg-muted/15 rounded-xl border p-6 backdrop-blur-sm space-y-4'>
            <div className='flex items-center gap-2.5'>
              <div className='bg-blue-500/10 rounded-lg p-2'>
                <Mail className='size-5 text-blue-500' />
              </div>
              <h3 className='text-sm font-bold tracking-tight'>Support & Customer Service</h3>
            </div>
            <ul className='space-y-2 text-xs text-muted-foreground leading-relaxed'>
              <li><strong>Contact Support:</strong> <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a></li>
              <li><strong>Response Times:</strong> Support requests are reviewed regularly. Most inquiries receive a comprehensive response within 1–2 business days.</li>
              <li><strong>Cancellation:</strong> Customers can cancel future monthly subscription renewals at any time directly through their developer dashboard without any fees or lock-ins.</li>
            </ul>
          </div>
        </div>

        {/* Legal & Policy Compliance Links */}
        <div className='border-border/30 bg-muted/10 rounded-2xl border p-6 sm:p-8 backdrop-blur-sm max-w-3xl mx-auto space-y-4'>
          <div className='flex items-center gap-2.5'>
            <HelpCircle className='size-5 text-blue-500' />
            <h3 className='text-base font-bold tracking-tight'>Legal Disclosures & Policy Documents</h3>
          </div>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            We maintain total commercial transparency. Please review our public operational policy documents:
          </p>
          <div className='grid gap-4 sm:grid-cols-2 pt-2'>
            <Link
              to='/terms'
              className='flex items-center justify-between rounded-lg border border-border/20 bg-muted/5 px-4 py-2.5 text-xs font-semibold hover:bg-muted/10 transition-colors'
            >
              Terms of Service
              <ArrowRight className='size-3.5 text-muted-foreground' />
            </Link>
            <Link
              to='/privacy'
              className='flex items-center justify-between rounded-lg border border-border/20 bg-muted/5 px-4 py-2.5 text-xs font-semibold hover:bg-muted/10 transition-colors'
            >
              Privacy Policy
              <ArrowRight className='size-3.5 text-muted-foreground' />
            </Link>
            <Link
              to='/refund'
              className='flex items-center justify-between rounded-lg border border-border/20 bg-muted/5 px-4 py-2.5 text-xs font-semibold hover:bg-muted/10 transition-colors'
            >
              Refund Policy
              <ArrowRight className='size-3.5 text-muted-foreground' />
            </Link>
            <Link
              to='/acceptable-use'
              className='flex items-center justify-between rounded-lg border border-border/20 bg-muted/5 px-4 py-2.5 text-xs font-semibold hover:bg-muted/10 transition-colors'
            >
              Acceptable Use Policy
              <ArrowRight className='size-3.5 text-muted-foreground' />
            </Link>
            <Link
              to='/docs'
              className='flex items-center justify-between rounded-lg border border-border/20 bg-muted/5 px-4 py-2.5 text-xs font-semibold hover:bg-muted/10 transition-colors'
            >
              Documentation
              <ArrowRight className='size-3.5 text-muted-foreground' />
            </Link>
            <Link
              to='/contact'
              className='flex items-center justify-between rounded-lg border border-border/20 bg-muted/5 px-4 py-2.5 text-xs font-semibold hover:bg-muted/10 transition-colors'
            >
              Contact Us
              <ArrowRight className='size-3.5 text-muted-foreground' />
            </Link>
          </div>
        </div>

      </PageTransition>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/review-info')({
  component: ReviewInfoPage,
})
