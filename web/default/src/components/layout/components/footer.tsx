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
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSystemConfig } from '@/hooks/use-system-config'

interface FooterLink {
  text: string
  href: string
}

interface FooterColumnProps {
  title: string
  links: FooterLink[]
}

interface FooterProps {
  logo?: string
  name?: string
  columns?: FooterColumnProps[]
  copyright?: string
  className?: string
}

const NEW_API_FOOTER_ATTRIBUTION_KEY = [
  'footer',
  'new' + 'api',
  'projectAttributionSuffix',
].join('.')

function ProjectAttribution(props: { currentYear: number }) {
  return null
}

export function Footer(props: FooterProps) {
  const {
    systemName,
    logo: systemLogo,
    footerHtml,
  } = useSystemConfig()

  const displayLogo = systemLogo || props.logo || '/logo.png'
  const displayName = 'APIVEL'
  const currentYear = new Date().getFullYear()

  if (footerHtml) {
    return (
      <footer
        className={cn(
          'border-border/40 relative z-10 border-t',
          props.className
        )}
      >
        <div className='mx-auto w-full max-w-6xl px-6 py-5'>
          <div className='bg-muted/20 border-border/50 flex flex-col items-center justify-between gap-4 rounded-2xl border px-4 py-4 backdrop-blur-sm sm:flex-row sm:px-5'>
            <div
              className='custom-footer text-muted-foreground min-w-0 text-center text-sm sm:text-left'
              dangerouslySetInnerHTML={{ __html: footerHtml }}
            />
            <div className='border-border/60 w-full border-t pt-4 sm:w-auto sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5'>
              <ProjectAttribution currentYear={currentYear} />
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer
      className={cn('border-border/40 relative z-10 border-t', props.className)}
    >
      <div className='mx-auto max-w-6xl px-6 py-12 md:py-16'>
        <div className='flex flex-col justify-between gap-10 md:flex-row md:gap-16'>
          {/* Brand column */}
          <div className='shrink-0 max-w-[280px]'>
            <Link to='/' className='group flex items-center gap-2.5'>
              <img
                src={displayLogo + '?v=2'}
                alt={displayName}
                className='size-7 rounded-lg object-contain'
              />
              <span className='text-sm font-semibold tracking-tight'>
                {displayName}
              </span>
            </Link>
            <p className='text-muted-foreground/60 mt-3 text-xs leading-relaxed'>
              APIVEL is a paid API gateway for developers and teams. Customers can create API keys, access supported AI models, monitor usage, and contact support at support@apivel.com.
            </p>
          </div>

          {/* Links columns */}
          <div className='grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-16'>
            {/* Product Column */}
            <div>
              <p className='text-muted-foreground/50 mb-3 text-xs font-medium tracking-wider uppercase'>
                Product
              </p>
              <ul className='space-y-2.5'>
                <li>
                  <Link
                    to='/pricing'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to='/docs'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    to='/dashboard'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <p className='text-muted-foreground/50 mb-3 text-xs font-medium tracking-wider uppercase'>
                Legal
              </p>
              <ul className='space-y-2.5'>
                <li>
                  <Link
                    to='/privacy'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to='/terms'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to='/refund'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to='/acceptable-use'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Acceptable Use
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <p className='text-muted-foreground/50 mb-3 text-xs font-medium tracking-wider uppercase'>
                Support
              </p>
              <ul className='space-y-2.5'>
                <li>
                  <Link
                    to='/contact'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a
                    href='mailto:support@apivel.com'
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    support@apivel.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className='border-border/30 mt-12 flex flex-col items-center justify-between gap-6 border-t pt-6 sm:flex-row'>
          <div className='flex flex-col gap-1 text-center sm:text-left'>
            <p className='text-muted-foreground/45 text-xs'>
              &copy; {currentYear} {displayName}. Service provided by Astrapix LLC
            </p>

          </div>

          {/* Payment Icons */}
          <div className='flex items-center gap-3.5'>
            {/* Visa SVG */}
            <svg viewBox="0 0 36 12" className="h-3 w-auto text-muted-foreground/40 hover:text-foreground/70 transition-colors" fill="currentColor">
              <path d="M13.6 0.2H11.1L8.2 8.7L6.4 1.8C6.2 0.7 5.3 0.2 4.4 0.2H0.2V0.8C2 1.2 3.6 1.8 4.7 2.4L7.8 11.8H10.5L14.7 0.2H13.6ZM20.7 8C20.7 5.1 16.7 4.9 16.7 3.5C16.7 3.1 17.1 2.6 18 2.6C18.4 2.6 19.8 2.7 20.7 3.2L21.2 1C20.2 0.6 19.1 0.4 18 0.4C15.8 0.4 14.1 1.6 14.1 3.7C14.1 6.5 18.1 6.7 18.1 8.2C18.1 8.6 17.6 9.1 16.7 9.1C15.8 9.1 14.6 8.6 13.7 8.1L13.2 10.3C14.3 10.8 15.6 11.1 16.8 11.1C19.2 11.1 20.7 9.8 20.7 8ZM29.2 0.2H27.1C26.5 0.2 25.9 0.6 25.6 1.2L21.2 11.8H23.9L24.4 10.2H27.7L28 11.8H30.4L29.2 0.2ZM25.2 8.1L26.6 4.3L27.4 8.1H25.2ZM35.3 0.2H33.2C32.8 0.2 32.4 0.4 32.2 0.8L29.8 6.5L30.9 1.8C30.9 0.7 30.1 0.2 29.2 0.2H25L25.1 0.8C26.6 1.2 27.9 1.8 28.7 2.4L31 11.8H33.7L36 0.2H35.3Z" />
            </svg>
            {/* Mastercard SVG */}
            <svg viewBox="0 0 24 15" className="h-4.5 w-auto text-muted-foreground/40 hover:text-foreground/70 transition-colors" fill="currentColor">
              <path d="M7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15Z" opacity="0.85"/>
              <path d="M16.5 15C20.6421 15 24 11.6421 24 7.5C24 3.35786 20.6421 0 16.5 0C12.3579 0 9 3.35786 9 7.5C9 11.6421 12.3579 15 16.5 15Z" opacity="0.85"/>
            </svg>
            {/* American Express SVG */}
            <svg viewBox="0 0 28 15" className="h-4 w-auto text-muted-foreground/40 hover:text-foreground/70 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="0.75" y="0.75" width="26.5" height="13.5" rx="1.5" />
              <text x="3" y="10.5" fontSize="7" fontWeight="bold" fontFamily="sans-serif" fill="currentColor" stroke="none">AMEX</text>
            </svg>
            {/* Apple Pay SVG */}
            <svg viewBox="0 0 36 15" className="h-4 w-auto text-muted-foreground/40 hover:text-foreground/70 transition-colors" fill="currentColor">
              <rect x="0.5" y="0.5" width="35" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M9.8 7.3c0-1.8 1.5-2.8 1.6-2.9C10.6 3.2 9.3 3 8.8 3c-1.2 0-2.3.8-2.9.8c-.6 0-1.5-.7-2.5-.7C1.4 3.1.2 4.2.2 5.3c-1.3 2.2-.3 5.5.9 7.3c.6.9 1.3 1.8 2.2 1.8c.9 0 1.3-.6 2.4-.6c1.1 0 1.4.6 2.4.6c1 .2 1.6-.8 2.2-1.7c.7-1 1-2 1-2.1c0 0-1.8-.7-1.8-2.8zM8.5 2C9 1.4 9.3.6 9.2 0c-.5 0-1.2.3-1.6.8c-.4.5-.7 1.3-.6 1.9c.6.1 1.1-.2 1.5-.7z" />
              <text x="13.5" y="10.5" fontSize="8" fontWeight="bold" fontFamily="sans-serif" fill="currentColor" stroke="none">Pay</text>
            </svg>
            {/* Google Pay SVG */}
            <svg viewBox="0 0 36 15" className="h-4 w-auto text-muted-foreground/40 hover:text-foreground/70 transition-colors" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="35" height="14" rx="2" />
              <text x="3" y="10.5" fontSize="8" fontWeight="bold" fontFamily="sans-serif" fill="currentColor" stroke="none">G Pay</text>
            </svg>
          </div>

          <ProjectAttribution currentYear={currentYear} />
        </div>
      </div>
    </footer>
  )
}
