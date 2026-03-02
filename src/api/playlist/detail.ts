import request from '../request'

export interface PlaylistDetailParams {
  id: number | string
  s?: number
}

// 此处用到已经定义好的 SongDetail
import type { SongDetail } from '../song/songDetail'
import type { PlaylistSubscriber } from './highquality'

export interface PlaylistDetail {
  id: number
  name: string
  coverImgId: number
  coverImgUrl: string
  coverImgId_str: string
  adType: number
  userId: number
  createTime: number
  status: number
  opRecommend: boolean
  highQuality: boolean
  newImported: boolean
  updateTime: number
  trackCount: number
  specialType: number
  privacy: number
  trackUpdateTime: number
  commentThreadId: string
  playCount: number
  trackNumberUpdateTime: number
  subscribedCount: number
  cloudTrackCount: number
  ordered: boolean
  description: string
  tags: string[]
  updateFrequency: string | null
  backgroundCoverId: number
  backgroundCoverUrl: string | null
  titleImage: number
  titleImageUrl: string | null
  englishTitle: string | null
  officialPlaylistType: string | null
  copied: boolean
  relateResType: string | null
  subscribers: PlaylistSubscriber[]
  subscribed: boolean
  creator: PlaylistSubscriber
  tracks: SongDetail[] // 这里的 tracks 可能不全
  videoIds: string[] | null
  videos: string[] | null
  trackIds: {
    id: number
    v: number
    t: number
    at: number
    alg: string | null
    uid: number
    rcmdReason: string
  }[]
  bannedTrackIds: string[] | null
  mvResourceInfos: string[] | null
  shareCount: number
  commentCount: number
  remixVideo: string | null
  sharedUsers: string[] | null
  historySharedUsers: string[] | null
}

export interface PlaylistDetailResponse {
  code: number
  relatedVideos: string[] | null
  playlist: PlaylistDetail
  urls: string[] | null
  privileges: {
    id: number
    fee: number
    payed: number
    realPayed: number
    st: number
    pl: number
    dl: number
    sp: number
    cp: number
    subp: number
    cs: boolean
    maxbr: number
    fl: number
    pc: string | null
    toast: boolean
    flag: number
    paidBigBang: boolean
    preSell: boolean
    playMaxbr: number
    downloadMaxbr: number
    maxBrLevel: string
    playMaxBrLevel: string
    downloadMaxBrLevel: string
    plLevel: string
    dlLevel: string
    flLevel: string
    rscl: string | null
    freeTrialPrivilege: {
      resConsumable: boolean
      userConsumable: boolean
      listenType: number | null
    }
    chargeInfoList: {
      rate: number
      chargeUrl: string | null
      chargeMessage: string | null
      chargeType: number
    }[]
  }[]
  sharedPrivilege: string | null
}

// 获取歌单详情 (包含完整 trackIds)
export const getPlaylistDetail = (params: PlaylistDetailParams) => {
  return request.get<PlaylistDetailResponse>('/playlist/detail', { params })
}
