// 获取歌单所有歌曲（分页）

import request from '../../request'
import type { SongDetail } from '../../song/detail'

export interface PlaylistAllParams {
  id: number
  limit: number // 每页歌曲数量（建议 50）
  offset?: number // 偏移量，用于分页，默认值为 0；传入 limit=50&offset=50 可获取第 51-100 首
}

export interface PlaylistAllResponse {
  code: number
  songs: SongDetail[]
}

export const getPlaylistTracks = (params: PlaylistAllParams) => {
  return request.get<PlaylistAllResponse>('/playlist/track/all', { params })
}
