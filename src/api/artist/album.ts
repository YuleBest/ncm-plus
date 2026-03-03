// 获取歌手全部专辑
// 接口: GET /artist/album?id={artistId}&limit={n}&offset={n}

import request from '../request'

export interface GetArtistAlbumsParams {
  id: number // 歌手 ID
  limit?: number // 每页数量，默认 30
  offset?: number // 偏移量
}

// 单张专辑（列表中的简化字段）
export interface ArtistAlbum {
  id: number
  name: string
  picUrl: string // 封面图片 URL
  blurPicUrl: string
  publishTime: number // 发布时间戳
  company: string // 唱片公司
  subType: string // 子类型，如 "录音室版"
  type: string // 类型，如 "专辑" / "Single" / "EP/Single"
  size: number // 歌曲数量
  alias: string[] // 别名
  description: string
  [key: string]: unknown
}

export interface GetArtistAlbumsResponse {
  code: number
  more: boolean // 是否还有更多
  hotAlbums: ArtistAlbum[] // 专辑列表
  [key: string]: unknown
}

export const getArtistAlbums = (params: GetArtistAlbumsParams) => {
  return request.get<GetArtistAlbumsResponse>('/artist/album', { params })
}
