// 获取音乐 url

// **必选参数 :** `id` : 音乐 id
// `level`: 播放音质等级, 分为 `standard` => `标准`,`higher` => `较高`, `exhigh`=>`极高`,
// `lossless`=>`无损`, `hires`=>`Hi-Res`, `jyeffect` => `高清环绕声`, `sky` => `沉浸环绕声`, `dolby` => `杜比全景声`, `jymaster` => `超清母带`

import request from '../request'

export interface GetSongUrlParams {
  id: number
  level:
    | 'standard'
    | 'higher'
    | 'exhigh'
    | 'lossless'
    | 'hires'
    | 'jyeffect'
    | 'sky'
    | 'dolby'
    | 'jymaster'
}

export interface GetSongUrlResponse {
  code: number
  data: GetSongUrlData[]
}

export interface GetSongUrlData {
  data: Array<{
    id: number
    url: string
    size: number // 文件大小, 单位 bytes
    [key: string]: unknown
  }>
  code: number // 200 成功
}

export const getSongUrl = (params: GetSongUrlParams) => {
  return request.get<GetSongUrlResponse>('/song/url/v1', { params })
}
