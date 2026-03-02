// 搜索音乐
// 已完成支持：歌曲、歌手

import request from './request'

// 定义请求参数
export interface SearchParams {
  keywords: string // 必选：关键词
  limit?: number // 可选：返回数量，默认为 30
  offset?: number // 可选：偏移数量 (页数-1)*limit
  type?: number // 可选：默认为 1 即单曲 , 取值意义 : 1: 单曲, 10: 专辑, 100: 歌手, 1000:歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频, 1018:综合, 2000:声音(搜索声音返回字段格式会不一样)
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

// 歌手搜索结果
export interface ArtistResult {
  id: number
  name: string
  picUrl: string
  albumSize: number
  mvSize: number
  musicSize: number
  alias?: string[]
  [key: string]: unknown
}

export interface SearchResponse {
  result: {
    songs?: Song[]
    songCount?: number
    artists?: ArtistResult[]
    artistCount?: number
  }
  code: number
}

// 搜索接口引入
export const searchMusic = (params: SearchParams) => {
  return request.get<SearchResponse>('/search', {
    params,
  })
}

// 专门搜索歌手（type=100）
export const searchArtists = (params: Omit<SearchParams, 'type'>) => {
  return request.get<SearchResponse>('/search', {
    params: { ...params, type: 100 },
  })
}
