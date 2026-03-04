import request from '../request'

export interface UserPlaylistParams {
  uid: number | string // 用户 id
  limit?: number // 返回数量 , 默认为 30
  offset?: number // 偏移数量，用于分页 , 如 :( 页数 -1)*30, 其中 30 为 limit 的值 , 默认为 0
}

export interface UserPlaylistResponse {
  code: number
  more: boolean
  playlist: UserPlaylistItem[]
}

export interface UserPlaylistItem {
  id: number
  name: string
  coverImgUrl: string
  coverImgId: number
  trackCount: number
  playCount: number
  createTime: number
  updateTime: number
  userId: number
  creator: {
    userId: number
    nickname: string
    avatarUrl: string
  }
  description: string | null
  tags: string[]
  specialType: number
  subscribedCount: number
}

export const getUserPlaylist = (params: UserPlaylistParams) => {
  return request.get<UserPlaylistResponse>('/user/playlist', { params })
}
