// 获取歌词

import request from './request'

export interface GetSongLyricParams {
  id: number // 歌曲 id
}

export interface GetSongLyricResponse {
  code: number
  lrc: {
    version: number
    lyric: string
  }
  klyric: {
    version: number
    lyric: string
  }
  tlyric?: {
    version: number
    lyric: string
  }
  romalrc?: {
    version: number
    lyric: string
  }
  [key: string]: unknown
}

export const getSongLyric = (params: GetSongLyricParams) => {
  return request.get<GetSongLyricResponse>('/lyric', { params })
}
