// 获取歌词

import request from '../request'

export interface GetSongLyricParams {
  id: number // 歌曲 id
}

export interface GetSongLyricResponse {
  code: number
  data: GetSongLyricData[]
}

export interface GetSongLyricData {
  lrc: {
    version: number
    lyric: string // `[00:00.000] 作词 : 张国祥\n[00:01.000] 作曲 : 汤小康\n...`
  }
  [key: string]: unknown
}

export const getSongLyric = (params: GetSongLyricParams) => {
  return request.get<GetSongLyricResponse>('/lyric', { params })
}
