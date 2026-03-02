// 获取精品歌单

import request from '../../request'

export interface HighQualityPlaylistParams {
  cat?: string
  limit?: number
  before?: number
}

export interface PlaylistSubscriber {
  defaultAvatar: boolean
  province: number
  authStatus: number
  followed: boolean
  avatarUrl: string
  accountStatus: number
  gender: number
  city: number
  birthday: number
  userId: number
  userType: number
  nickname: string
  signature: string
  description: string
  detailDescription: string
  avatarImgId: number
  backgroundImgId: number
  backgroundUrl: string
  authority: number
  mutual: boolean
  expertTags: string[] | null
  experts: Record<string, string> | null
  djStatus: number
  vipType: number
  remarkName: string | null
  avatarImgIdStr: string
  backgroundImgIdStr: string
}

export interface HighQualityPlaylist {
  name: string
  id: number
  trackNumberUpdateTime: number
  status: number
  userId: number
  createTime: number
  updateTime: number
  subscribedCount: number
  trackCount: number
  cloudTrackCount: number
  coverImgUrl: string
  coverImgId: number
  description: string
  tags: string[]
  playCount: number
  trackUpdateTime: number
  specialType: number
  totalDuration: number
  creator: PlaylistSubscriber
  tracks: null
  subscribers: PlaylistSubscriber[]
  subscribed: boolean
  commentThreadId: string
  newImported: boolean
  adType: number
  highQuality: boolean
  privacy: number
  ordered: boolean
  anonimous: boolean
  coverStatus: number
  recommendInfo: string | null
  shareCount: number
  coverImgId_str: string
  commentCount: number
  copywriter: string
  tag: string
}

export interface HighQualityPlaylistResponse {
  playlists: HighQualityPlaylist[]
  code: number
  more: boolean
  lasttime: number
  total: number
}

export const getHighQualityPlaylists = (params?: HighQualityPlaylistParams) => {
  return request.get<HighQualityPlaylistResponse>('/top/playlist/highquality', { params })
}
