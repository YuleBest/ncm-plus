// 二维码登录 —— 生成 key
// 无需参数

import request from '../../request'

export interface QrKeyResponse {
  code: number
  data: {
    unikey: string // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    code: number
  }
}

export const getQrKey = () => {
  return request.get<QrKeyResponse>('/login/qr/key')
}
