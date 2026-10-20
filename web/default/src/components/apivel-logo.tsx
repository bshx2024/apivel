import React from 'react'
import { cn } from '@/lib/utils'

export interface ApivelLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  glow?: boolean
}

export function ApivelLogo({ className, glow = true, ...props }: ApivelLogoProps) {
  return (
    <svg
      viewBox='0 0 48 48'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('size-full select-none', className)}
      {...props}
    >
      <defs>
        <linearGradient id='apivel-cyan' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#38bdf8' />
          <stop offset='100%' stopColor='#6366f1' />
        </linearGradient>
        <linearGradient id='apivel-purple' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#818cf8' />
          <stop offset='100%' stopColor='#c084fc' />
        </linearGradient>
        <radialGradient id='apivel-core-glow' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#ffffff' stopOpacity='1' />
          <stop offset='45%' stopColor='#a5f3fc' stopOpacity='0.8' />
          <stop offset='100%' stopColor='#818cf8' stopOpacity='0' />
        </radialGradient>
        {glow && (
          <filter id='apivel-glow-filter' x='-20%' y='-20%' width='140%' height='140%'>
            <feGaussianBlur stdDeviation='1.2' result='blur' />
            <feComposite in='SourceGraphic' in2='blur' operator='over' />
          </filter>
        )}
      </defs>

      <g filter={glow ? 'url(#apivel-glow-filter)' : undefined}>
        {/* 次芒：四角斜向水晶切面 */}
        <polygon points='24,24 16,19 11,11 19,16' fill='url(#apivel-cyan)' opacity='0.85' />
        <polygon points='24,24 29,16 37,11 32,19' fill='url(#apivel-purple)' opacity='0.85' />
        <polygon points='24,24 19,32 11,37 16,29' fill='url(#apivel-cyan)' opacity='0.85' />
        <polygon points='24,24 32,29 37,37 29,32' fill='url(#apivel-purple)' opacity='0.85' />

        {/* 主芒：上主芒 */}
        <polygon points='24,3 24,24 18,20' fill='url(#apivel-cyan)' />
        <polygon points='24,3 30,20 24,24' fill='url(#apivel-purple)' opacity='0.9' />

        {/* 下主芒 */}
        <polygon points='24,45 18,28 24,24' fill='url(#apivel-cyan)' opacity='0.95' />
        <polygon points='24,45 24,24 30,28' fill='url(#apivel-purple)' />

        {/* 左主芒 */}
        <polygon points='3,24 20,18 24,24' fill='url(#apivel-cyan)' />
        <polygon points='3,24 24,24 20,30' fill='url(#apivel-cyan)' opacity='0.8' />

        {/* 右主芒 */}
        <polygon points='45,24 24,24 28,18' fill='url(#apivel-purple)' opacity='0.9' />
        <polygon points='45,24 28,30 24,24' fill='url(#apivel-purple)' />

        {/* 晶莹棱线高光描边 */}
        <polyline points='24,3 24,45' stroke='#ffffff' strokeWidth='0.8' strokeLinecap='round' opacity='0.7' />
        <polyline points='3,24 45,24' stroke='#ffffff' strokeWidth='0.8' strokeLinecap='round' opacity='0.7' />
        <polyline points='11,11 37,37' stroke='#ffffff' strokeWidth='0.5' strokeLinecap='round' opacity='0.4' />
        <polyline points='37,11 11,37' stroke='#ffffff' strokeWidth='0.5' strokeLinecap='round' opacity='0.4' />

        {/* 核心光晕与极光闪核 */}
        <circle cx='24' cy='24' r='6.5' fill='url(#apivel-core-glow)' />
        <polygon points='24,19.5 25.4,22.6 28.5,24 25.4,25.4 24,28.5 22.6,25.4 19.5,24 22.6,22.6' fill='#ffffff' />
      </g>
    </svg>
  )
}
