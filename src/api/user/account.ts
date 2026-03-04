// 获取账号信息

import request from '../request'
import type { LoginProfile } from '../login/status'

export const getAccountInfo = () => {
  return request.get<UserAccountResponse>('/user/account')
}

export interface UserAccountResponse {
  code: number
  account: UserAccount
  profile: LoginProfile
}

export interface UserAccount {
  id: number
  userName: string
  type: number
  status: number
  whitelistAuthority: number
  createTime: number
  tokenVersion: number
  ban: number
  baoyueVersion: number
  donateVersion: number
  vipType: number
  anonimousUser: boolean
  paidFee: boolean
}
