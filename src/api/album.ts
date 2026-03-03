// 专辑信息

import request from './request'

export interface GetAlbumDetailParams {
  id: number // 传入专辑ID
}

export const getAlbumDetail = (params: GetAlbumDetailParams) => {
  return request.get<AlbumDetailResponse>('/album', { params })
}

// 专辑详情响应
export interface AlbumDetailResponse {
  resourceState: boolean
  songs: Song[] // 歌曲列表
  code: number
  album: Album // 专辑信息
  [key: string]: unknown
}

// 专辑信息（常用字段）
export interface Album {
  id: number
  name: string
  picUrl: string // 封面图片 URL
  blurPicUrl: string // 模糊封面 URL
  description: string // 专辑描述
  publishTime: number // 发布时间戳
  company: string // 唱片公司
  artist: Artist // 主歌手
  artists: Artist[] // 所有参与歌手
  size: number // 歌曲数量
  subType: string // 子类型，如 "录音室版"
  tags: string // 标签
  info: AlbumInfo // 评论等信息
  [key: string]: unknown
}

// 专辑附加信息（评论相关）
export interface AlbumInfo {
  commentThread: CommentThread
  liked: boolean
  commentCount: number
  likedCount: number
  shareCount: number
  threadId: string
  [key: string]: unknown
}

// 评论线程信息
export interface CommentThread {
  id: string
  resourceInfo: ResourceInfo
  resourceType: number
  commentCount: number
  likedCount: number
  shareCount: number
  hotCount: number
  [key: string]: unknown
}

// 评论资源信息
export interface ResourceInfo {
  id: number
  name: string
  imgUrl: string
  [key: string]: unknown
}

// 歌手信息（常用字段）
export interface Artist {
  id: number
  name: string
  picUrl: string // 歌手头像 URL
  img1v1Url: string // 正方形头像 URL
  alias: string[] // 别名
  trans: string // 翻译名
  briefDesc: string // 简介
  [key: string]: unknown
}

// 歌曲信息（常用字段）
export interface Song {
  id: number
  name: string
  alia: string[] // 歌曲别名
  ar: Artist[] // 歌手列表
  al: AlbumSummary // 所属专辑（简化版）
  dt: number // 时长（毫秒）
  mv: number // MV ID
  fee: number // 付费标识，参考歌单
  privilege?: Privilege // 播放权限信息
  tns?: string[] // 翻译名（某些歌曲存在）
  [key: string]: unknown
}

// 专辑摘要（歌曲中引用的专辑简化信息）
export interface AlbumSummary {
  id: number
  name: string
  pic: number // 封面图片 ID
  pic_str: string // 封面图片 ID 字符串
  picUrl?: string // 封面图片 URL（可能不存在，但常见）
  [key: string]: unknown
}

// 播放权限信息（简化）
export interface Privilege {
  id: number
  fee: number
  payed: number
  st: number
  pl: number
  dl: number
  sp: number
  cp: number
  subp: number
  maxbr: number
  fl: number
  toast: boolean
  flag: number
  preSell: boolean
  playMaxbr: number
  downloadMaxbr: number
  maxBrLevel: string
  playMaxBrLevel: string
  downloadMaxBrLevel: string
  plLevel: string
  dlLevel: string
  flLevel: string
  rscl: number
  freeTrialPrivilege: FreeTrialPrivilege
  chargeInfoList: ChargeInfo[]
  [key: string]: unknown
}

// 免费试听权限
export interface FreeTrialPrivilege {
  resConsumable: boolean
  userConsumable: boolean
  listenType: any | null
  cannotListenReason: number
  playReason: any | null
  freeLimitTagType: any | null
  [key: string]: unknown
}

// 收费信息项
export interface ChargeInfo {
  rate: number
  chargeUrl: any | null
  chargeMessage: any | null
  chargeType: number
  [key: string]: unknown
}
