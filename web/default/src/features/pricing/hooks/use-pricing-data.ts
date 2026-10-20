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
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStatus } from '@/hooks/use-status'
import { getPricing } from '../api'
const MOCK_PRICING_RESPONSE = {
  success: true,
  data: [
    {
      model_name: 'deepseek-v4-pro',
      quota_type: 1,
      model_ratio: 0.5,
      completion_ratio: 2.0,
      enable_groups: ['default', 'vip'],
      supported_endpoint_types: ['/v1/chat/completions'],
      tags: 'flagship,reasoning',
      vendor_id: 1,
    },
    {
      model_name: 'qwen-3.7-max',
      quota_type: 1,
      model_ratio: 0.8,
      completion_ratio: 3.0,
      enable_groups: ['default'],
      supported_endpoint_types: ['/v1/chat/completions'],
      tags: 'alibaba,coding',
      vendor_id: 2,
    },
    {
      model_name: 'glm-5.2',
      quota_type: 1,
      model_ratio: 1.2,
      completion_ratio: 2.5,
      enable_groups: ['default'],
      supported_endpoint_types: ['/v1/chat/completions'],
      tags: 'zhipu,reasoning',
      vendor_id: 3,
    },
    {
      model_name: 'kimi-k3',
      quota_type: 1,
      model_ratio: 0.7,
      completion_ratio: 2.0,
      enable_groups: ['default'],
      supported_endpoint_types: ['/v1/chat/completions'],
      tags: 'moonshot,long-context',
      vendor_id: 4,
    },
    {
      model_name: 'minimax-m3',
      quota_type: 1,
      model_ratio: 0.4,
      completion_ratio: 2.0,
      enable_groups: ['default'],
      supported_endpoint_types: ['/v1/chat/completions'],
      tags: 'minimax,fast',
      vendor_id: 5,
    },
  ],
  vendors: [
    { id: 1, name: 'DeepSeek', icon: 'deepseek', description: 'DeepSeek AI' },
    { id: 2, name: 'Qwen', icon: 'qwen', description: 'Alibaba Cloud Qwen' },
    { id: 3, name: 'GLM', icon: 'zhipu', description: 'Zhipu GLM' },
    { id: 4, name: 'Kimi', icon: 'moonshot', description: 'Moonshot Kimi' },
    { id: 5, name: 'MiniMax', icon: 'minimax', description: 'MiniMax' },
  ],
  group_ratio: { default: 1.0, vip: 0.9 },
  usable_group: { default: 'Standard', vip: 'VIP Partner' },
  supported_endpoint: { '/v1/chat/completions': 'Chat Completions' },
  auto_groups: ['default'],
}

export function usePricingData() {
  const { status } = useStatus()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      try {
        const res = await getPricing()
        if (res && res.data && res.data.length > 0) {
          return res
        }
        return MOCK_PRICING_RESPONSE
      } catch (err) {
        return MOCK_PRICING_RESPONSE
      }
    },
    staleTime: 0,
  })

  // Ensure rates never reach zero to prevent division errors
  const priceRate = useMemo(
    () => Math.max((status?.price as number) ?? 1, 0.001),
    [status?.price]
  )
  const usdExchangeRate = useMemo(
    () => Math.max((status?.usd_exchange_rate as number) ?? priceRate, 0.001),
    [status?.usd_exchange_rate, priceRate]
  )

  const models = useMemo(() => {
    if (!data?.data || !data?.vendors) return []

    const vendorMap = new Map(data.vendors.map((v) => [v.id, v]))

    return data.data.map((model, index) => {
      const vendor = model.vendor_id
        ? vendorMap.get(model.vendor_id)
        : undefined
      return {
        id: (model as any).id ?? index + 1,
        ...model,
        key: model.model_name,
        vendor_name: vendor?.name,
        vendor_icon: vendor?.icon,
        vendor_description: vendor?.description,
        group_ratio: data.group_ratio,
      }
    })
  }, [data])

  return {
    models,
    vendors: data?.vendors ?? [],
    groupRatio: data?.group_ratio ?? {},
    usableGroup: data?.usable_group ?? {},
    endpointMap: data?.supported_endpoint ?? {},
    autoGroups: data?.auto_groups ?? [],
    isLoading,
    error,
    refetch,
    priceRate,
    usdExchangeRate,
  }
}
