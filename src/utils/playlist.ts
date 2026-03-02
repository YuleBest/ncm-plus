/**
 * NCM Plus · 歌单工具函数
 */

/**
 * 从用户输入中提取网易云歌单 ID。
 *
 * 支持的格式：
 *  1. 移动端分享链接
 *       https://music.163.com/m/playlist?id=7662651829&creatorId=...
 *  2. 带哈希的 Web 链接
 *       https://music.163.com/#/playlist?id=7662651829
 *  3. 普通 Web 链接
 *       https://music.163.com/playlist?id=7662651829
 *  4. 包含链接的分享文本（如复制的整段分享文案）
 *       "听陈奕迅热门精选 https://music.163.com/m/playlist?id=7662651829&creatorId=..."
 *  5. 纯数字歌单 ID（≥ 6 位，避免误判短数字）
 *       7662651829
 *
 * @param input 用户在搜索框中输入的原始字符串
 * @returns     提取到的歌单 ID 字符串；未识别则返回 null
 */
export function extractPlaylistId(input: string): string | null {
  const text = input.trim()
  if (!text) return null

  // ── 1. URL 识别 ────────────────────────────────────────────
  // 只要文本同时含有 music.163.com 域名和 playlist 路径片段，
  // 就从查询参数中提取 id=<数字>
  if (text.includes('music.163.com') && text.includes('playlist')) {
    const idMatch = text.match(/[?&]id=(\d+)/)
    if (idMatch?.[1]) return idMatch[1]
  }

  // ── 2. 纯数字 ID ───────────────────────────────────────────
  // 只接受 6 位及以上的纯数字，避免把普通短数字误判为歌单 ID
  if (/^\d{6,}$/.test(text)) return text

  return null
}
