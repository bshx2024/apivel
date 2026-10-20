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
import { useAuthStore } from '@/stores/auth-store'
import { PublicLayout } from '@/components/layout'
import { CTA, Features, Hero, HowItWorks, Stats, FAQ, Calculator, ShowcaseGallery, ChineseModelsGrid, FeaturedBlogs } from './components'
import { ComplianceSaaSDetails } from './components/compliance-saas-details'
import { useHomePageContent } from './hooks'

export function Home() {
  const { auth } = useAuthStore()
  const isAuthenticated = !!auth.user

  return (
    <PublicLayout showMainContainer={false}>
      <Hero isAuthenticated={isAuthenticated} />
      <Stats />
      <ShowcaseGallery />
      <ChineseModelsGrid />
      <FeaturedBlogs />
      <Features />
      <HowItWorks />
      <ComplianceSaaSDetails />
      <FAQ />
      <CTA isAuthenticated={isAuthenticated} />
    </PublicLayout>
  )
}


