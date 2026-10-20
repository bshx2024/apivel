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
import { useTranslation } from 'react-i18next'
import { Layers, Coins, Code2, Shuffle } from 'lucide-react'

interface StatsProps {
  className?: string
}

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()

  const stats = [
    {
      icon: <Layers className='size-5 text-blue-500' />,
      title: t('Multiple Upstream Providers'),
      desc: t('Reliably routing requests through supported model providers.')
    },
    {
      icon: <Coins className='size-5 text-emerald-500' />,
      title: t('Usage-Based Billing'),
      desc: t('Flexible usage credits and monthly subscription options.')
    },
    {
      icon: <Code2 className='size-5 text-violet-500' />,
      title: t('OpenAI-Compatible Routes'),
      desc: t('One unified standard endpoint for all AI models.')
    },
    {
      icon: <Shuffle className='size-5 text-amber-500' />,
      title: t('Routing & Scheduling'),
      desc: t('Smart fallback routing, failover, and load balancing.')
    }
  ]

  return (
    <div className='border-border/40 bg-muted/10 relative z-10 border-y'>
      <div className='mx-auto max-w-6xl px-6 py-12 md:py-16'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8'>
          {stats.map((s, i) => (
            <div
              key={i}
              className='border-border/20 bg-muted/5 flex flex-col gap-3 rounded-xl border p-5 transition-colors hover:border-blue-500/20'
            >
              <div className='bg-blue-500/10 rounded-lg p-2.5 w-fit shrink-0' style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}>
                {s.icon}
              </div>
              <div className='space-y-1'>
                <h3 className='text-sm font-bold tracking-tight'>{s.title}</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
