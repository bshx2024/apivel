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
 * Fallback copy method using document.execCommand (works in HTTP)
 */
function fallbackCopyToClipboard(text: string): boolean {
  const textArea = document.createElement('textarea')
  textArea.value = text

  // Make the textarea out of viewport
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  textArea.style.opacity = '0'
  textArea.setAttribute('readonly', '')

  document.body.appendChild(textArea)

  try {
    // Select the text
    textArea.focus()
    textArea.select()

    // For iOS devices
    const range = document.createRange()
    range.selectNodeContents(textArea)
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
    textArea.setSelectionRange(0, text.length)

    // Execute copy command
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    // Clear selection ranges for better UX
    const selectionAfter = window.getSelection()
    if (selectionAfter) {
      selectionAfter.removeAllRanges()
    }

    return successful
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Fallback copy failed:', err)
    document.body.removeChild(textArea)
    return false
  }
}

/**
 * Copy text to clipboard with fallback support for HTTP environments
 *
 * @param text - The text to copy
 * @returns Promise that resolves to true if successful, false otherwise
 *
 * @example
 * ```ts
 * const success = await copyToClipboard('Hello, World!')
 * if (success) {
 *   console.log('Copied successfully')
 * }
 * ```
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Guard for SSR / non-browser environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  // Try modern clipboard API first (HTTPS required)
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Clipboard API failed, trying fallback method:', error)
      // Try fallback method
      return fallbackCopyToClipboard(text)
    }
  } else {
    // Use fallback method directly
    return fallbackCopyToClipboard(text)
  }
}

/**
 * Detect if current device is mobile/touch environment
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  )
}

/**
 * Open email draft with API key and developer setup instructions
 */
export function sendKeyToEmail(
  apiKey: string,
  userEmail?: string,
  originUrl?: string
): void {
  if (typeof window === 'undefined') return
  const origin = originUrl || window.location.origin
  const subject = encodeURIComponent('【APIVEL】您的 API Key 凭证与开发连接配置')
  const body = encodeURIComponent(
    `您好！\n\n以下是您在 APIVEL 账户的 API 连接凭据，便于您在电脑端开发环境配置使用：\n\n- Base URL: ${origin}/v1\n- API Key: ${apiKey}\n- 推荐测试模型: deepseek-v4-flash, qwen3.8-flash\n\n快速接入代码示例（Python）：\nfrom openai import OpenAI\n\nclient = OpenAI(\n    base_url="${origin}/v1",\n    api_key="${apiKey}"\n)\n\nresponse = client.chat.completions.create(\n    model="deepseek-v4-flash",\n    messages=[{"role": "user", "content": "Hello APIVEL!"}]\n)\nprint(response.choices[0].message.content)\n\n祝您开发顺利！\nAPIVEL 团队`
  )
  window.open(`mailto:${userEmail || ''}?subject=${subject}&body=${body}`, '_blank')
}

