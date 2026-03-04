// 获取歌手粉丝数量

import request from '../../request'

export interface GetArtistFollowCountParams {
  id: number // 歌手 ID
}

export interface GetArtistFollowCountResponse {
  code: number
  message: string
  data: ArtistFollowCount
}

export interface ArtistFollowCount {
  isFollow: boolean // 用户是否关注
  fansCnt: number // 粉丝数
  followCnt: number // 关注数
  followDay: string // 关注日期
  followDayCnt: number // 关注日期数（关注了多少天）
  follow: boolean // 是否被关注
}

export const GetArtistFollowCount = (params: GetArtistFollowCountParams) => {
  return request.get<GetArtistFollowCountResponse>('/artist/follow/count', { params })
}
