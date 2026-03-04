// 二维码登录 —— 生成二维码
import request from '../../request'

// {
//   "code": 200,
//   "data": {
//     "qrurl": "https://music.163.com/login?codekey=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
//     "qrimg": ""
//   }
// }

export interface QrCreateParams {
  key: string // 二维码 key
  qrimg?: boolean // true 表示返回二维码图片 base64（qrimg），建议使用否则需爬取链接（qrurl）
  timestamp: number // 带时间戳防止缓存（非接口参数）
}

export interface QrCreateResponse {
  code: number
  data: {
    // 二者其一的值为空
    qrurl: string | null // 二维码 url
    qrimg: string | null // 二维码图片 base64
  }
}

export const getQrCreate = (params: QrCreateParams) => {
  return request.get<QrCreateResponse>('/login/qr/create', { params })
}
