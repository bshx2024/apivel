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
import { Link } from '@tanstack/react-router'
import { 
  CheckCircle2, 
  CreditCard, 
  Key, 
  Terminal, 
  Activity, 
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react'
import { AnimateInView } from '@/components/animate-in-view'

export function ComplianceSaaSDetails() {
  const steps = [
    {
      title: 'Create an Account',
      desc: 'Sign up in seconds using your developer email or connected GitHub account.',
      icon: <CheckCircle2 className='size-5 text-blue-500' />
    },
    {
      title: 'Choose a Plan or Credits',
      desc: 'Select a monthly plan or purchase initial usage credits securely through checkout.',
      icon: <CreditCard className='size-5 text-blue-500' />
    },
    {
      title: 'Generate API Keys',
      desc: 'Instantly generate secure API keys in the developer dashboard.',
      icon: <Key className='size-5 text-blue-500' />
    },
    {
      title: 'Integrate the Endpoint',
      desc: 'Use the OpenAI-compatible endpoint with your favorite AI SDKs or curl.',
      icon: <Terminal className='size-5 text-blue-500' />
    },
    {
      title: 'Track Usage & Billing',
      desc: 'Monitor request logs, token usage, and remaining balance in real time.',
      icon: <Activity className='size-5 text-blue-500' />
    },
    {
      title: 'Contact Support Anytime',
      desc: 'Reach out to support@apivel.com for routing adjustments or enterprise limits.',
      icon: <HelpCircle className='size-5 text-blue-500' />
    }
  ]

  const deliverables = [
    'Monthly developer subscription plans',
    'Prepaid pay-as-you-go API usage credits',
    'Higher concurrency and global rate limits',
    'Smart fallback routing & server failovers',
    'Multi-user shared team API keys',
    'Priority onboarding & technical email support'
  ]

  return (
    <section className='border-border/40 relative z-10 border-t px-6 py-24 md:py-32'>
      <div className='mx-auto max-w-6xl'>
        {/* Deliverability Section */}
        <div className='grid gap-16 lg:grid-cols-12'>
          
          {/* Column Left: Steps */}
          <div className='lg:col-span-7 space-y-10'>
            <AnimateInView className='space-y-3'>
              <p className='text-muted-foreground text-xs font-medium tracking-widest uppercase'>
                Delivery Model
              </p>
              <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
                How customers receive access
              </h2>
              <p className='text-muted-foreground text-sm leading-relaxed max-w-xl'>
                APIVEL delivers a fully automated SaaS interface where developers configure access, handle payments, and access secure model endpoints instantly.
              </p>
            </AnimateInView>

            <div className='grid gap-6 sm:grid-cols-2'>
              {steps.map((step, i) => (
                <AnimateInView 
                  key={step.title} 
                  delay={i * 80}
                  className='border-border/20 bg-muted/5 flex gap-3.5 rounded-xl border p-4.5 transition-colors hover:border-blue-500/20'
                >
                  <div className='mt-0.5 shrink-0'>{step.icon}</div>
                  <div className='space-y-1'>
                    <h3 className='text-sm font-semibold'>{step.title}</h3>
                    <p className='text-muted-foreground text-xs leading-relaxed'>{step.desc}</p>
                  </div>
                </AnimateInView>
              ))}
            </div>
          </div>

          {/* Column Right: Billing and Compliance */}
          <div className='lg:col-span-5 flex flex-col justify-between gap-8'>
            
            {/* Box 1: What customers pay for */}
            <AnimateInView 
              animation='fade-up'
              className='border-border/30 bg-muted/10 rounded-2xl border p-6.5 backdrop-blur-sm space-y-4'
            >
              <div className='flex items-center gap-2.5'>
                <div className='bg-blue-500/10 rounded-lg p-2'>
                  <Zap className='size-5 text-blue-500' />
                </div>
                <h3 className='text-base font-bold tracking-tight'>What customers pay for</h3>
              </div>
              <p className='text-muted-foreground text-xs leading-relaxed'>
                We charge for platform usage and custom features under our standard commercial structures:
              </p>
              <ul className='grid gap-2.5 text-xs text-muted-foreground'>
                {deliverables.map((item) => (
                  <li key={item} className='flex items-start gap-2'>
                    <span className='text-blue-500 font-bold mt-0.5'>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </AnimateInView>

            {/* Box 2: Compliance */}
            <AnimateInView 
              animation='fade-up'
              delay={150}
              className='border-border/30 bg-muted/10 rounded-2xl border p-6.5 backdrop-blur-sm space-y-4'
            >
              <div className='flex items-center gap-2.5'>
                <div className='bg-emerald-500/10 rounded-lg p-2'>
                  <ShieldCheck className='size-5 text-emerald-500' />
                </div>
                <h3 className='text-base font-bold tracking-tight'>Compliance & Responsible Use</h3>
              </div>
              <p className='text-muted-foreground text-xs leading-relaxed'>
                APIVEL maintains a strictly compliant API infrastructure. We actively prohibit any fraudulent, abusive, infringing, harmful, or unauthorized use of our gateway services.
              </p>
              <p className='text-muted-foreground text-xs leading-relaxed'>
                All transactions, checkouts, and routing logs are subject to regular audits. Review our guidelines for details.
              </p>
              <div className='pt-2'>
                <Link
                  to='/acceptable-use'
                  className='inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors'
                >
                  View Acceptable Use Policy
                  <ArrowRight className='size-3' />
                </Link>
              </div>
            </AnimateInView>

          </div>

        </div>
      </div>
    </section>
  )
}
