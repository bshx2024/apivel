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
import { EXCLUDED_GROUPS, QUOTA_TYPE_VALUES } from '../constants'
import type { PricingModel } from '../types'

// ----------------------------------------------------------------------------
// Model Helper Utilities
// ----------------------------------------------------------------------------

/**
 * Get available groups for a model
 */
export function getAvailableGroups(
  model: PricingModel,
  usableGroup: Record<string, { desc: string; ratio: number }>
): string[] {
  const modelEnableGroups = Array.isArray(model.enable_groups)
    ? model.enable_groups
    : []

  return Object.keys(usableGroup)
    .filter((g) => !EXCLUDED_GROUPS.includes(g))
    .filter((g) => modelEnableGroups.includes(g))
}

/**
 * Replace model placeholder in endpoint path
 */
export function replaceModelInPath(path: string, modelName: string): string {
  return path.replace(/\{model\}/g, modelName)
}

/**
 * Check if model is token-based pricing
 */
export function isTokenBasedModel(model: PricingModel): boolean {
  return model.quota_type === QUOTA_TYPE_VALUES.TOKEN
}

const MODEL_DESCRIPTION_MAP_EN: Record<string, string> = {
  '旗舰级逻辑推理与代码生成大模型。1M 超长上下文，复杂架构设计与重构开发首选。':
    'Flagship reasoning & code generation LLM with 1M context. Ideal for complex architecture & codebase refactoring.',
  '全能中文 NLP 与长文档分析模型。高准确率与流畅响应，免费试用体验首选。':
    'All-around NLP & long-document analysis model. High accuracy and fast streaming response.',
  '极速性价比 Agent 对话模型。擅长多轮长文本沟通与自动化分析，VIP 专享。':
    'High-efficiency Agent conversational model. Specialized in multi-turn long-text analysis.',
  '通义千问旗舰级超大规模语言模型 (Qwen3.7-Max)，基于 Sparse MoE 架构，支持 100 万 tokens 超长上下文和最大推理逻辑。':
    'Qwen 3.7 Max flagship large model with Sparse MoE architecture, supporting 1M tokens context and deep reasoning.',
  '通义千问旗舰级超大规模语言模型（Qwen3.7-Max），基于 Sparse MoE 架构，支持 100 万 tokens 超长上下文和最大推理逻辑。':
    'Qwen 3.7 Max flagship large model with Sparse MoE architecture, supporting 1M tokens context and deep reasoning.',
  'DeepSeek 毫秒级极速版。超低延迟与极高性价比，适合高并发批量 API 调用。':
    'DeepSeek ultra-fast edition. Low latency & high cost-efficiency for bulk API calls.',
  '美团 2026 旗舰级 1.6 万亿 MoE 大模型。1M 超长上下文，35T 预训练数据与 5万卡集群打造，VIP 专享。':
    'Meituan 2026 flagship 1.6T MoE model. 1M context trained on 35T tokens, VIP exclusive.',
  '入门级超高响应模型。极低成本，适合快速接口测试与基础对话机器人。':
    'Entry-level fast-response model. Ultra low cost, ideal for rapid API testing and basic bots.',
  'Sensetime 核心旗舰大模型。':
    'SenseTime flagship core large model.',
}

const MODEL_NAME_FALLBACK_EN: Record<string, string> = {
  'infer/deepseek-v4-pro':
    'Flagship reasoning & code generation LLM with 1M context.',
  'infer/glm-5.2':
    'All-around NLP & long-document analysis model. High accuracy and fast streaming response.',
  'infer/minimax-m3':
    'High-efficiency Agent conversational model. Specialized in multi-turn long-text analysis.',
  'infer/qwen3.7-max':
    'Qwen 3.7 Max flagship model with 1M context and deep reasoning.',
  'qwen3.8-max':
    'Qwen 3.8 Max flagship model with 1M context and deep reasoning.',
  'deepseek-v4.1-flash':
    'Official 0910 release: DeepSeek Flash engine with native multimodal vision and 437 t/s ultra-fast inference. Call via deepseek-v4.1-flash or deepseek-v4-flash interchangeably on APIVEL.',
  'deepseek-v4-flash':
    'Official 0910 release: DeepSeek Flash engine with native multimodal vision and 437 t/s ultra-fast inference. Call via deepseek-v4.1-flash or deepseek-v4-flash interchangeably on APIVEL.',
  'sensenova/deepseek-v4-flash':
    'DeepSeek ultra-fast edition. Low latency & high cost-efficiency.',
  'sensenova/sensenova-6.7-flash-lite':
    'Entry-level fast-response model. Ideal for rapid API testing.',
  'longcat/longcat-2.0':
    'Meituan 2026 flagship 1.6T MoE model with 1M context.',
}

/**
 * Get localized model description based on current language
 */
export function getLocalizedModelDescription(
  rawDesc: string | undefined | null,
  modelName: string | undefined | null,
  lang: string
): string {
  if (!rawDesc) {
    if (
      lang.startsWith('en') &&
      modelName &&
      MODEL_NAME_FALLBACK_EN[modelName.toLowerCase()]
    ) {
      return MODEL_NAME_FALLBACK_EN[modelName.toLowerCase()]
    }
    return rawDesc || ''
  }

  if (lang.startsWith('en')) {
    const trimmed = rawDesc.trim()
    if (MODEL_DESCRIPTION_MAP_EN[trimmed]) {
      return MODEL_DESCRIPTION_MAP_EN[trimmed]
    }
    if (modelName && MODEL_NAME_FALLBACK_EN[modelName.toLowerCase()]) {
      return MODEL_NAME_FALLBACK_EN[modelName.toLowerCase()]
    }
  }

  return rawDesc
}
