// 获取评论

import request from '../request'

export const GetArtists = (params: GetCommentsParams) => {
  return request.get<GetCommentsResponse>('/comment/new', { params })
}

export interface GetCommentsParams {
  id: number // 资源 ID
  type: number // 资源类型, 0: 歌曲, 1: mv，2: 歌单, 3: 专辑, 4: 电台节目, 5: 视频, 6: 动态, 7: 电台
  pageNo?: number // 页码，默认1
  pageSize?: number // 分页参数,每页多少条数据,默认 20
  sortType?: number // 排序方式, 1:按推荐排序, 2:按热度排序, 3:按时间排序
  cursor?: string // 当`sortType`为 3 时且页数不是第一页时需传入,值为上一条数据的 time
}

// 顶层响应接口
export interface GetCommentsResponse {
  code: number
  data: Data
  message: string
}

// 数据主体
export interface Data {
  commentsTitle: string
  comments: Comment[]
  currentCommentTitle: string
  currentComment: any | null
  totalCount: number
  hasMore: boolean
  cursor: string
  sortType: number
  sortTypeList: SortTypeItem[]
  style: string
  bottomAction: any | null
  likeAnimation: LikeAnimation
  newReplyExpGroupName: string
  expandCount: number
}

// 单条评论
export interface Comment {
  user: User
  beReplied: any[] | null
  commentId: number
  threadId: string
  content: string
  richContent: any | null
  status: number
  time: number
  timeStr: string
  needDisplayTime: boolean
  likedCount: number
  replyCount: number
  liked: boolean
  expressionUrl: any | null
  parentCommentId: number
  repliedMark: boolean
  pendantData: any | null
  pickInfo: any | null
  showFloorComment: ShowFloorComment
  decoration: Decoration
  commentLocationType: number
  musicianSayAirborne: any | null
  args: any | null
  tag: Tag
  source: any | null
  resourceSpecialType: any | null
  extInfo: Record<string, unknown>
  commentVideoVO: CommentVideoVO
  contentResource: any | null
  contentPicNosKey: any | null
  contentPicExt: any | null
  contentPicUrl: any | null
  voiceNosKey: any | null
  voiceWhaleId: any | null
  voiceDurationMillSecond: number
  grade: any | null
  userBizLevels: any | null
  userNameplates: any | null
  ipLocation: IpLocation
  owner: boolean
  tail: any | null
  hideSerialComments: any | null
  hideSerialTips: any | null
  topicList: any | null
  privacy: number
  medal: any | null
  outShowComments: any[]
  likeAnimationMap: LikeAnimationMap
  bottomTags: any[]
  airborneAction: any | null
  reward: any | null
  userTop: boolean
  highlight: boolean
  wordMatchList: any | null
  track: string // 实际是 JSON 字符串
}

// 用户信息
export interface User {
  avatarDetail: any | null
  commonIdentity: any | null
  locationInfo: any | null
  liveInfo: any | null
  followed: boolean
  vipRights: VipRights
  relationTag: any | null
  anonym: number
  encryptUserId: string
  userId: number
  userType: number
  nickname: string
  avatarUrl: string
  authStatus: number
  expertTags: any | null
  experts: any | null
  vipType: number
  remarkName: any | null
  isHug: boolean
  socialUserId: any | null
  target: any | null
}

// VIP 权益
export interface VipRights {
  associator: any | null
  musicPackage: any | null
  redplus: any | null
  redVipAnnualCount: number
  redVipLevel: number
  relationType: number
  memberLogo: any | null
  extInfo: any | null
}

// 楼层评论
export interface ShowFloorComment {
  replyCount: number
  comments: any | null
  showReplyCount: boolean
  topCommentIds: any | null
  target: any | null
}

// 装饰信息
export interface Decoration {
  repliedByAuthorCount: number
}

// 标签信息
export interface Tag {
  datas: any[]
  extDatas: any[]
  contentDatas: any[]
  contentPicDatas: any[]
  relatedCommentIds: any | null
}

// 评论视频信息
export interface CommentVideoVO {
  showCreationEntrance: boolean
  allowCreation: boolean
  creationOrpheusUrl: any | null
  playOrpheusUrl: any | null
  videoCount: number
  forbidCreationText: string
}

// IP 归属地
export interface IpLocation {
  ip: any | null
  location: string
  userId: any | null
}

// 点赞动画映射（动态键名）
export interface LikeAnimationMap {
  [key: string]: LikeAnimationConfig
}

// 单个点赞动画配置
export interface LikeAnimationConfig {
  activityCode: string
  startTime: number
  endTime: number
  beforeLikeIcon: string
  likeAnimations: string[]
  afterLikeIcon: string
  likeText: string
  sizeType: string
  vibrationParams: any | null
}

// 排序类型项
export interface SortTypeItem {
  sortType: number
  sortTypeName: string
  target: string
}

// 点赞动画全局配置
export interface LikeAnimation {
  animationConfigMap: {
    EVENT_FEED: any[]
    MOMENT: any[]
    INPUT: any[]
    COMMENT_AREA: any[]
  }
  version: number
}
