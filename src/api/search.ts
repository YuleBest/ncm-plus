// 搜索音乐

import request from './request'

// 定义请求参数
export interface SearchParams {
  keywords: string // 必选：关键词
  limit?: number // 可选：返回数量，默认为 30
  offset?: number // 可选：偏移数量 (页数-1)*limit
  type?: number // 可选：1:单曲, 10:专辑... 默认为 1
}

// 定义返回数据的结构
export interface Song {
  id: number
  name: string
  artists: Array<{
    id: number
    name: string
    img1v1Url: string
  }>
  album: {
    id: number
    name: string
    picId: number
  }
  duration: number // 时长
  fee: number // 0: 免费; 1: VIP 歌曲; 4: 购买专辑; 8: 非会员可免费播放低音质，会员可播放高音质及下载
  [key: string]: unknown // 允许其他不常用的字段存在
}

export interface SearchResponse {
  result: {
    songs?: Song[]
    songCount?: number
  }
  code: number
}

// 搜索接口引入
export const searchMusic = (params: SearchParams) => {
  return request.get<SearchResponse>('/search', {
    params,
  })
}
