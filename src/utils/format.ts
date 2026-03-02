/**
 * NCM Plus · 格式化工具函数
 */

/**
 * 格式化播放量
 * @example 123456789 → "1.2亿"  |  56789 → "5.7万"  |  999 → "999"
 */
export const formatPlayCount = (count: number): string => {
  if (!count) return '0'
  if (count > 100_000_000) return (count / 100_000_000).toFixed(1) + '亿'
  if (count > 10_000) return (count / 10_000).toFixed(1) + '万'
  return count.toString()
}

/**
 * 格式化时长（毫秒 → "mm:ss"）
 * 用于搜索结果、歌单列表等以毫秒为单位的场景
 * @example 185000 → "03:05"
 */
export const formatDuration = (ms: number): string => {
  if (!ms || isNaN(ms)) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 格式化时长（秒 → "mm:ss"）
 * 用于播放页进度条等以秒为单位的场景
 * @example 185.4 → "03:05"
 */
export const formatSeconds = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
