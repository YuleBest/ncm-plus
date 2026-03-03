// 获取逐字歌词

import request from '../request'

export interface GetSongLyricNewParams {
  id: number // 歌曲 id
}

/** 歌词字段通用结构 */
export interface LyricField {
  version: number
  lyric: string
}

export interface GetSongLyricNewResponse {
  code?: number
  sgc: boolean // 是否有歌词贡献者
  sfy: boolean
  qfy: boolean
  lrc: LyricField // 标准逐行歌词
  klyric: LyricField // 卡拉OK歌词
  tlyric?: LyricField // 翻译歌词
  romalrc?: LyricField // 罗马音歌词
  /**
   * 逐字歌词
   * lyric 行格式：[行起始ms,行时长ms](字起始ms,字时长cs,0)字 ...
   * 例：[16210,3460](16210,670,0)还(16880,410,0)没...
   */
  yrc?: LyricField
  ytlrc?: LyricField // 逐字翻译歌词
  yromalrc?: LyricField // 逐字罗马音歌词
  [key: string]: unknown
}

export const getSongLyricNew = (params: GetSongLyricNewParams) => {
  return request.get<GetSongLyricNewResponse>('/lyric/new', { params })
}
