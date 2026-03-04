// 二维码登录 —— 轮询
// {
//   "code": 803, // 803 表示未扫码，800 表示已过期，200 表示已登录
//   "message": "未扫码",
//   "cookie": "",
//   "profile": null
// }

import request from '../../request'

export interface QrCheckParams {
  key: string // 二维码 key
  noCookie?: boolean // 可选，如果传 "true" 则不返回 cookies
  timestamp?: number // 时间戳，防止缓存
}

export interface QrCheckResponse {
  code: number // 800 为二维码过期, 801 为等待扫码, 802 为待确认, 803 为授权登录成功(803 状态码下会返回 cookies), 如扫码后返回502, 则需加上noCookie参数
  message: string // 提示信息
  cookie: string // "cookie": "NMTID=xxxxxxx...; Max-Age=315360000; Expires=Sat, 01 Mar 2036 20:53:27 GMT; Path=/;"
}

export const getQrCheck = (params: QrCheckParams) => {
  return request.get<QrCheckResponse>('/login/qr/check', { params })
}
