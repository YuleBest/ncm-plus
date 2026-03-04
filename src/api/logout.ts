// 退出登录

import request from './request'

export interface LogoutResponse {
  code: number // 200 表示退出登录成功
}

export const getLogout = () => {
  return request.get<LogoutResponse>('/logout', {
    params: {
      timestamp: Date.now(),
    },
  })
}
