// 获取用户等级信息

import request from '../request'

export const getUserLevel = () => {
  return request.get<UserLevelResponse>('/user/level')
}

export interface UserLevelResponse {
  code: number
  full: boolean
  data: {
    userId: number
    info: string // 信息，使用$分割，例「60G音乐网盘免费容量$黑名单上限120$云音乐商城满100减12元优惠券$价值1200云贝」
    progress: number // 进度，是小数
    nextPlayCount: number // 下级播放次数
    nextLoginCount: number // 下级登录次数
    nowPlayCount: number // 当前播放次数
    nowLoginCount: number // 当前登录次数
    level: number // 等级
  }
}
