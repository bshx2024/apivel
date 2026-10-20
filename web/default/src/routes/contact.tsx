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
import { Mail, Shield, Terminal, Building2, HelpCircle } from 'lucide-react'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'

function ContactPage() {
  useEffect(() => {
    document.title = 'Contact | APIVEL'
  }, [])

  const departments = [
    {
      title: 'Billing & Account Access',
      desc: 'For checkout issues, subscriptions, cancellation requests, or payment questions.',
      email: 'support@apivel.com',
      icon: <HelpCircle className='size-5 text-blue-500' />
    },
    {
      title: 'Technical API Support',
      desc: 'For developer endpoint queries, library integrations, error codes, or SDK issues.',
      email: 'support@apivel.com',
      icon: <Terminal className='size-5 text-blue-500' />
    },
    {
      title: 'Model Access Requests',
      desc: 'Request higher concurrency, custom routing groups, or access to restricted model families.',
      email: 'support@apivel.com',
      icon: <Shield className='size-5 text-blue-500' />
    },
    {
      title: 'Enterprise & Sales',
      desc: 'Custom dedicated gateways, custom SLA parameters, high volume models, and onboarding.',
      email: 'support@apivel.com',
      icon: <Building2 className='size-5 text-blue-500' />
    }
  ]

  return (
    <PublicLayout>
      <PageTransition className='mx-auto max-w-4xl py-12 px-4 space-y-10'>
        
        {/* Header Section */}
        <div className='text-center space-y-3 max-w-2xl mx-auto'>
          <h1 className='text-3xl font-extrabold tracking-tight sm:text-4xl'>Contact Support</h1>
          <p className='text-muted-foreground text-sm sm:text-base leading-relaxed'>
            Have questions about billing, technical integrations, or custom gateway setups? Our support team is here to help you deploy successfully.
          </p>
        </div>

        {/* Unified Support Contact Card */}
        <div className='border-border/30 bg-muted/15 rounded-2xl border p-6 sm:p-8 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-6 justify-between max-w-3xl mx-auto'>
          <div className='space-y-2 text-center sm:text-left'>
            <span className='text-xs font-semibold uppercase tracking-widest text-blue-500'>Primary Channel</span>
            <h2 className='text-xl font-bold tracking-tight'>Official Customer Support</h2>
            <p className='text-muted-foreground text-xs max-w-md leading-relaxed'>
              For general billing, API gateway errors, model approval requests, and all inquiries, reach out directly via email.
            </p>
          </div>
          <a
            href='mailto:support@apivel.com'
            className='inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300'
          >
            <Mail className='size-4' />
            support@apivel.com
          </a>
        </div>

        {/* Detailed Department Inquiries */}
        <div className='grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto'>
          {departments.map((dept) => (
            <div
              key={dept.title}
              className='border-border/20 bg-muted/5 flex flex-col justify-between rounded-xl border p-5 transition-colors hover:border-blue-500/20'
            >
              <div className='space-y-3'>
                <div className='flex items-center gap-2.5'>
                  <div className='bg-blue-500/10 rounded-lg p-2 shrink-0'>
                    {dept.icon}
                  </div>
                  <h3 className='text-sm font-bold tracking-tight'>{dept.title}</h3>
                </div>
                <p className='text-muted-foreground text-xs leading-relaxed'>{dept.desc}</p>
              </div>
              <div className='mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-xs'>
                <span className='text-muted-foreground/60'>Send inquiry to:</span>
                <a href={`mailto:${dept.email}`} className='font-semibold text-blue-500 hover:underline'>
                  {dept.email}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Note Box */}
        <div className='border-border/30 rounded-xl border bg-muted/5 p-5 text-center text-xs text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed'>
          <strong>Response Time:</strong> We review support requests regularly. Most standard inquiries receive a response within 1–2 business days.
        </div>

        {/* Merchant & Operator Information */}
        <div className='border-border/30 rounded-xl border bg-muted/5 p-5 text-center text-xs text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed space-y-2'>
          <h4 className='font-bold text-foreground text-sm tracking-tight'>Merchant & Operator Information</h4>
          <p>
            <strong>Service Operator:</strong> Astrapix LLC
            <br />
            <strong>Platform:</strong> APIVEL (https://apivel.com)
            <br />
            <strong>Contact:</strong> <a href='mailto:support@apivel.com' className='text-blue-500 hover:underline'>support@apivel.com</a>
          </p>
        </div>

      </PageTransition>
    </PublicLayout>
  )
}

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})
