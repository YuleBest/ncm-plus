// 歌手信息

import request from './request'

export interface GetArtistsParams {
  id: number // 传入歌手ID
}

export interface GetArtistsResponse {
  more: boolean // 是否有百科等更多信息
  code: number
  artist: {
    topicPerson: number
    musicSize: number // 音乐数量
    albumSize: number // 专辑数量
    mvSize: number // MV数量
    briefDesc: string | null // 简介
    picUrl: string | null // 背景图URL
    followed: boolean // 用户是否关注
    trans: string | null // 翻译
    alias: Array<string> | null // 别名，如："alias": ["Jay Chou","周董"]
    name: string // 姓名/化名，如：周杰伦
    id: number
    publishTime: number // 加入时间（时间戳），如：1516594084751
    [key: string]: unknown
  }
  // 热门歌曲
  hotSongs: Array<{
    alia: Array<string> | null
    name: string
    id: number
    fee: 0 | 1 | 4 | 8 // 0: 免费或无版权; 1: VIP 歌曲; 4: 购买专辑; 8: 非会员可免费播放低音质，会员可播放高音质及下载
    dt: number // 时长（毫秒）
    // 所属专辑
    al: {
      id: number
      name: string
      picUrl: string
      [key: string]: unknown
    }
    // 合作歌手
    ar: Array<{
      id: number
      name: string
      [key: string]: unknown
    }>
    [key: string]: unknown
  }>
  [key: string]: unknown
}

export const GetArtists = (params: GetArtistsParams) => {
  return request.get<GetArtistsResponse>('/artists', { params })
}
