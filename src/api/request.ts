import axios from 'axios'

const request = axios.create({
  baseURL: 'https://ncmapi.yule.ink',
  timeout: 20000,
  withCredentials: true,
})

// 拦截器：添加真实ip
request.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    realIP: '116.25.146.177',
  }
  return config
})

export default request
