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

/**
 * Benchmark official prices (USD per 1,000,000 tokens) for China's flagship AI models.
 * Used for price anchoring ("Save X% vs Official").
 */
export interface OfficialPriceEntry {
  inputPerM: number // USD per 1M input tokens
  outputPerM: number // USD per 1M output tokens
  avgPerM: number // Average blended price USD per 1M tokens
  officialProvider: string
}

export const OFFICIAL_MODEL_PRICES: Record<string, OfficialPriceEntry> = {
  // DeepSeek Series
  'deepseek-v4-pro': { inputPerM: 0.14, outputPerM: 0.28, avgPerM: 0.21, officialProvider: 'DeepSeek' },
  'deepseek-v4': { inputPerM: 0.14, outputPerM: 0.28, avgPerM: 0.21, officialProvider: 'DeepSeek' },
  'deepseek-v4-flash': { inputPerM: 0.07, outputPerM: 0.14, avgPerM: 0.105, officialProvider: 'DeepSeek' },
  'deepseek-r1': { inputPerM: 0.55, outputPerM: 2.19, avgPerM: 1.37, officialProvider: 'DeepSeek' },
  'deepseek-chat': { inputPerM: 0.14, outputPerM: 0.28, avgPerM: 0.21, officialProvider: 'DeepSeek' },
  'deepseek-coder': { inputPerM: 0.14, outputPerM: 0.28, avgPerM: 0.21, officialProvider: 'DeepSeek' },

  // Qwen Series (Alibaba Cloud)
  'qwen3.8-max-preview': { inputPerM: 1.6, outputPerM: 6.4, avgPerM: 4.0, officialProvider: 'Alibaba Cloud' },
  'qwen3.7-max': { inputPerM: 1.6, outputPerM: 6.4, avgPerM: 4.0, officialProvider: 'Alibaba Cloud' },
  'qwen-max': { inputPerM: 1.6, outputPerM: 6.4, avgPerM: 4.0, officialProvider: 'Alibaba Cloud' },
  'qwen-plus': { inputPerM: 0.4, outputPerM: 1.2, avgPerM: 0.8, officialProvider: 'Alibaba Cloud' },
  'qwen-turbo': { inputPerM: 0.05, outputPerM: 0.15, avgPerM: 0.1, officialProvider: 'Alibaba Cloud' },

  // GLM Series (Zhipu AI / Z.ai)
  'glm-5.2': { inputPerM: 1.0, outputPerM: 3.0, avgPerM: 2.0, officialProvider: 'Zhipu AI' },
  'glm-5.1': { inputPerM: 1.0, outputPerM: 3.0, avgPerM: 2.0, officialProvider: 'Zhipu AI' },
  'glm-5': { inputPerM: 1.0, outputPerM: 3.0, avgPerM: 2.0, officialProvider: 'Zhipu AI' },
  'glm-4-plus': { inputPerM: 0.7, outputPerM: 2.0, avgPerM: 1.35, officialProvider: 'Zhipu AI' },
  'glm-4-air': { inputPerM: 0.15, outputPerM: 0.15, avgPerM: 0.15, officialProvider: 'Zhipu AI' },

  // Kimi Series (Moonshot AI)
  'kimi-k3': { inputPerM: 1.8, outputPerM: 5.4, avgPerM: 3.6, officialProvider: 'Moonshot AI' },
  'moonshot-v1-128k': { inputPerM: 1.8, outputPerM: 5.4, avgPerM: 3.6, officialProvider: 'Moonshot AI' },
  'moonshot-v1-32k': { inputPerM: 0.6, outputPerM: 1.8, avgPerM: 1.2, officialProvider: 'Moonshot AI' },

  // MiniMax Series
  'minimax-m3': { inputPerM: 1.2, outputPerM: 3.6, avgPerM: 2.4, officialProvider: 'MiniMax' },
  'abab6.5t': { inputPerM: 0.4, outputPerM: 1.2, avgPerM: 0.8, officialProvider: 'MiniMax' },
  'abab7-chat': { inputPerM: 1.2, outputPerM: 3.6, avgPerM: 2.4, officialProvider: 'MiniMax' },

  // Doubao Series (ByteDance)
  'doubao-pro-128k': { inputPerM: 0.12, outputPerM: 0.24, avgPerM: 0.18, officialProvider: 'ByteDance' },
  'doubao-seed-1.6': { inputPerM: 0.12, outputPerM: 0.24, avgPerM: 0.18, officialProvider: 'ByteDance' }
}

/**
 * Match a model name against official entries (fuzzy match key)
 */
export function getOfficialPriceEntry(modelName: string): OfficialPriceEntry | null {
  const lower = modelName.toLowerCase()
  if (OFFICIAL_MODEL_PRICES[lower]) {
    return OFFICIAL_MODEL_PRICES[lower]
  }

  // Fallback fuzzy match
  for (const [key, entry] of Object.entries(OFFICIAL_MODEL_PRICES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return entry
    }
  }

  return null
}

/**
 * Calculate savings percentage between APIVEL price and official price
 */
export function calculateSavingsVsOfficial(
  modelName: string,
  apivalePricePerMInUSD: number
): { savingsPercent: number; officialProvider: string; officialAvgPerM: number } | null {
  const official = getOfficialPriceEntry(modelName)
  if (!official || official.avgPerM <= 0 || apivalePricePerMInUSD <= 0) {
    return null
  }

  const savings = Math.round(((official.avgPerM - apivalePricePerMInUSD) / official.avgPerM) * 100)
  if (savings <= 0) return null

  return {
    savingsPercent: savings,
    officialProvider: official.officialProvider,
    officialAvgPerM: official.avgPerM
  }
}
