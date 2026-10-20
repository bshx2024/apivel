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
import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function IconSubotiz({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role='img'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      className={cn('shrink-0', className)}
      fill='currentColor'
      {...props}
    >
      <title>Subotiz</title>
      <path d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5c-2.485 0-4.5-1.12-4.5-2.5h2c0 .552 1.119 1 2.5 1s2.5-.448 2.5-1c0-.621-.611-.875-1.742-1.125l-1.016-.225C10.518 12.152 9 11.233 9 9.5 9 7.843 10.791 6.5 13 6.5s4 1.343 4 3h-2c0-.552-.895-1-2-1s-2 .448-2 1c0 .532.553.774 1.636 1.015l1.016.225C16.482 11.848 18 12.767 18 14.5c0 1.657-2.015 2-4.5 2z' />
    </svg>
  )
}
