// 获取歌曲红心数量

import request from '../../request'

export interface GetRedCountParams {
  id: number // 传入资源ID
}

export interface GetRedCountResponse {
  code: number
  data: {
    count: number
    countDesc: string // 介绍文本，如“100w+”
  }
}

export const getSongDetail = (params: GetRedCountParams) => {
  return request.get<GetRedCountResponse>('/song/red/count', { params })
}
