import request from '../request'

export interface UserDetailResponse {
  code: number
  level: number
  listenSongs: number
  userPoint: {
    userId: number
    balance: number
    updateTime: number
    version: number
    status: number
    blockBalance: number
  }
  mobileSign: boolean
  pcSign: boolean
  profile: {
    userId: number
    nickname: string
    avatarUrl: string
    backgroundUrl: string
    signature: string
    description: string
    detailDescription: string
    gender: number
    birthday: number
    city: number
    province: number
    vipType: number
    authStatus: number
    djStatus: number
    accountStatus: number
    followeds: number
    follows: number
    eventCount: number
    playlistCount: number
    playlistBeSubscribedCount: number
  }
  peopleCanSeeMyPlayRecord: boolean
  bindings: Array<{
    userId: number
    url: string
    expired: boolean
    bindingTime: number
    tokenJsonStr: string
    expiresIn: number
    refreshTime: number
    id: number
    type: number
  }>
  adValid: boolean
  codeCache: string
  createTime: number
  createDays: number
}

export const getUserDetail = (uid: number | string) => {
  return request.get<UserDetailResponse>('/user/detail', { params: { uid } })
}
