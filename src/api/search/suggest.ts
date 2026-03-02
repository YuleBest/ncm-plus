// 搜索建议词

import request from '../request'

export const getSuggestDetail = (params: GetSuggestParams) => {
  return request.get<SuggestResponse>('/search/suggest', { params })
}

export interface GetSuggestParams {
  keywords: string // 搜索关键词
  type?: string // 可选，如果传 'mobile' 则返回移动端数据
}

// 1. 艺人简要信息
export interface artistDetail {
  id: number
  name: string
  picUrl?: string
  [key: string]: unknown
}

// 2. 专辑简要信息
export interface albumDetail {
  id: number
  name: string
  artist: artistDetail
  picId: number
  [key: string]: unknown
}

// 3. 歌曲简要信息
export interface songDetail {
  id: number
  name: string
  artists: artistDetail[]
  album: albumDetail
  duration: number // 对应 dt
  [key: string]: unknown
}

export interface SuggestResult {
  songs?: songDetail[] // 可选，因为搜索结果可能没有歌曲
  albums?: albumDetail[] // 同理
  artists?: artistDetail[]
  order?: string[] // 结果的排序顺序，比如 ["songs", "artists", "albums"...]
}

export interface SuggestResponse {
  code: number
  result: SuggestResult
}
