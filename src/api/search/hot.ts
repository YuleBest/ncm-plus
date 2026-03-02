// 热搜
//
// {
//   "code": 200,
//   "result": {
//     "hots": [
//       {
//         "first": "海屿你",
//         "second": 1,
//         "third": null,
//         "iconType": 1
//       },
//       {
//         "first": "林俊杰 我对缘分小心翼翼",
//         "second": 1,
//         "third": null,
//         "iconType": 1
//       },
// ...
//     ]
//   }
// }

import request from '../request'

export const getHotSearchDetail = () => {
  return request.get<hotSearchResponse>('/search/hot')
}

export interface hotSearchResponse {
  code: number
  result: {
    hots: hotSearchDetail[]
  }
}

export interface hotSearchDetail {
  first: string // 搜索词
  second: number // 热度值
  third: string | null // 描述文字
  iconType: number // 1: 🔥热; 2: 新; 3: 推; 0: 无
  [key: string]: unknown
}
