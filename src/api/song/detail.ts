// 获取歌曲详情

import request from '../request'

export interface SongDetailParams {
  ids: string
}

export interface SongDetailResponse {
  code: number
  songs: SongDetail[]
}

export interface SongDetail {
  id: number
  name: string // 歌曲标题
  t: 0 | 1 | 2 // type: 0: 一般类型; 1: 通过云盘上传的音乐，网易云不存在公开对应, 如果没有权限将不可用; 2: 通过云盘上传的音乐，网易云存在公开对应, 如果没有权限则只能看到信息，但无法直接获取到文件
  ar: Array<{
    id: number
    name: string
    [key: string]: unknown
  }> // 艺术家
  al: {
    id: number
    name: string
    picUrl: string // 专辑封面链接
    [key: string]: unknown
  } // 专辑
  dt: number // 时长, 单位:毫秒
  st: number // 歌曲状态
  alia: string[] // 别名
  fee: 0 | 1 | 4 | 8 // 0: 免费或无版权; 1: VIP 歌曲; 4: 购买专辑; 8: 非会员可免费播放低音质，会员可播放高音质及下载
  pop: number // 流行度，可以是非整数，0.00-100.00
  mv: number // mv id
  originCoverType: number // 0: 未知; 1: 原唱; 2: 翻唱
  privilege: {
    toast: boolean // 是否版权提示
    flLevel: string // 免费用户的该歌曲播放音质, none 为未知或无权限(不代表不能播放)，下同
    plLevel: string // 当前用户的该歌曲最高试听音质
    dlLevel: string // 当前用户的该歌曲最高下载音质
    maxBrLevel: string // 歌曲最高音质
    [key: string]: unknown
  }
  [key: string]: unknown
}

export const getSongDetail = (params: SongDetailParams) => {
  return request.get<SongDetailResponse>('/song/detail', { params })
}
