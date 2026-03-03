// 获取所有榜单列表
// 无需参数

import request from './request'

// 顶层响应接口
export interface GetToplistsResponse {
  code: number
  list: Toplist[]
  artistToplist: ArtistToplist // 歌手榜，一般只有一个
  [key: string]: unknown
}

// 单个榜单（歌单）信息
export interface Toplist {
  subscribers: any[] // 订阅者列表，通常为空或用户对象数组
  subscribed: null | boolean // 当前用户是否订阅
  creator: null | any // 创建者信息，榜单通常为 null
  artists: null | any[] // 相关歌手，榜单通常为 null
  tracks: null | any[] // 歌曲列表，榜单预览中通常为 null
  updateFrequency: string // 更新频率描述，如 "更新85首"
  backgroundCoverId: number
  backgroundCoverUrl: null | string
  titleImage: number
  coverText: null | string
  titleImageUrl: null | string
  coverImageUrl: null | string
  iconImageUrl: null | string
  englishTitle: null | string
  opRecommend: boolean
  recommendInfo: null | any
  socialPlaylistCover: null | any
  tsSongCount: number
  algType: null | any
  originalCoverId: number
  topTrackIds: null | string // 可能为 null 或字符串（逗号分隔的 ID）
  playlistType: string // 如 "UGC"
  uiPlaylistType: null | string
  specialType: number // 如 10 表示榜单
  privacy: number // 0 表示公开
  trackNumberUpdateTime: number // 时间戳
  trackUpdateTime: number // 时间戳
  highQuality: boolean
  coverImgId: number
  updateTime: number // 时间戳
  newImported: boolean
  anonimous: boolean
  coverImgUrl: string // 封面图片 URL
  trackCount: number // 歌曲数量
  commentThreadId: string // 评论线程 ID
  totalDuration: number // 总时长（可能为 0）
  playCount: number // 播放次数
  adType: number
  subscribedCount: number // 订阅人数
  cloudTrackCount: number
  createTime: number // 创建时间戳
  ordered: boolean
  description: string | null // 描述
  status: number
  tags: any[] // 标签列表
  userId: number // 创建者用户 ID
  name: string // 榜单名称
  id: number // 榜单 ID
  coverImgId_str: string // 封面图片 ID 的字符串形式
  ToplistType?: string // 榜单类型标记，如 "S" (飙升榜) 或 "N" (新歌榜)，可能不存在
  [key: string]: unknown
}

export interface ArtistToplist {
  coverUrl: string
  name: string
  upateFrequency: string // 应该是错误字段，不过这里还是加进来
  position: number
  updateFrequency: string // 更新描述
  [key: string]: unknown
}

export const getToplists = () => {
  return request.get<GetToplistsResponse>('/toplist')
}
