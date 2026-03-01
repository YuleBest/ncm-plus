// 检查歌曲是否可用

import request from '../request'

export interface SongCheckParams {
  id: string
}

export interface SongCheckResponse {
  code: number
  data: SongCheckData[]
}

export interface SongCheckData {
  success: boolean // true 可用, false 不可用
  message: string
  [key: string]: unknown
}

export const getSongCheck = (params: SongCheckParams) => {
  return request.get<SongCheckResponse>('/check/music', { params })
}
