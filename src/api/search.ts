// 搜索接口
// type: 1=单曲, 10=专辑, 100=歌手, 1000=歌单

import request from './request'

// ── 请求参数 ─────────────────────────────────────────────────
export interface SearchParams {
  keywords: string
  limit?: number // 默认 30
  offset?: number // (页数-1)*limit
  type?: number // 1|10|100|1000
}

// ── 单曲（type=1） ───────────────────────────────────────────
export interface SearchSong {
  id: number
  name: string
  alias: string[]
  artists: Array<{ id: number; name: string; [key: string]: unknown }>
  album: {
    id: number
    name: string
    picId: number
    [key: string]: unknown
  }
  duration: number // 毫秒
  fee: number // 0:免费 1:VIP 4:购辑 8:低质
  [key: string]: unknown
}

// ── 歌手（type=100） ─────────────────────────────────────────
export interface SearchArtist {
  id: number
  name: string
  picUrl: string
  img1v1Url: string
  albumSize: number
  musicSize: number
  mvSize: number
  alias: string[]
  fansSize?: number
  trans?: string | null
  [key: string]: unknown
}

// ── 专辑（type=10） ──────────────────────────────────────────
export interface SearchAlbum {
  id: number
  name: string
  picUrl: string
  publishTime: number
  company: string | null
  size: number // 歌曲数
  type: string // "专辑" / "Single" / "EP/Single"
  alia?: string[]
  artist: {
    id: number
    name: string
    picUrl: string
    [key: string]: unknown
  }
  artists: Array<{ id: number; name: string; [key: string]: unknown }>
  [key: string]: unknown
}

// ── 歌单（type=1000） ────────────────────────────────────────
export interface SearchPlaylist {
  id: number
  name: string
  coverImgUrl: string
  trackCount: number
  playCount: number
  creator: {
    nickname: string
    userId: number
    avatarUrl: string
    [key: string]: unknown
  }
  description: string | null
  [key: string]: unknown
}

// ── 统一响应 ─────────────────────────────────────────────────
export interface SearchResponse {
  result: {
    songs?: SearchSong[]
    songCount?: number
    artists?: SearchArtist[]
    artistCount?: number
    albums?: SearchAlbum[]
    albumCount?: number
    playlists?: SearchPlaylist[]
    playlistCount?: number
    hasMore?: boolean
    [key: string]: unknown
  }
  code: number
  [key: string]: unknown
}

// ── 通用搜索 ─────────────────────────────────────────────────
export const searchMusic = (params: SearchParams) =>
  request.get<SearchResponse>('/search', { params })

// ── 各类型快捷函数 ───────────────────────────────────────────
export const searchSongs = (params: Omit<SearchParams, 'type'>) =>
  searchMusic({ ...params, type: 1 })

export const searchArtists = (params: Omit<SearchParams, 'type'>) =>
  searchMusic({ ...params, type: 100 })

export const searchAlbums = (params: Omit<SearchParams, 'type'>) =>
  searchMusic({ ...params, type: 10 })

export const searchPlaylists = (params: Omit<SearchParams, 'type'>) =>
  searchMusic({ ...params, type: 1000 })

// 兼容旧名出口（search.ts 原有的 Song / ArtistResult 名）
export type Song = SearchSong
export type ArtistResult = SearchArtist
