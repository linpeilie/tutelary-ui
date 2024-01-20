import type { AxiosInstance, AxiosResponse } from 'axios'
import axios from 'axios'
import { getToken } from '../auth'
import type { ApiResponse, ExpandAxiosRequestConfig, ExpandAxiosResponse, ExpandInternalAxiosRequestConfig } from './types'
import { useUserStore } from '@/store/modules/user'

const errorStateMap = new Map([
  [400, '请求方式错误'],
  [401, '请重新登录'],
  [403, '拒绝访问'],
  [404, '请求地址不存在'],
  [500, '服务器出错'],
])

const notLoginErrorCode = '999900011'

function errorHandler(err: any) {
  if (err.config?.showLoading)
    window.$loadingBar.error()

  if (err.config?.showErrorMessage) {
    const message: string = errorStateMap.get(err.response.status) || '请求出错，请稍后重试'
    handleErrorMessage(message)
  }
  return Promise.reject(err)
}

function handleErrorMessage(errorMessage: string) {
  window.$message.error(errorMessage)
}

function handleErrorCode(errorCode: string) {
  if (notLoginErrorCode === errorCode) {
    const userStore = useUserStore()
    userStore.logout()
  }
}

const successCode = 1

export class AxiosRequest {
  private defaultConfig: ExpandAxiosRequestConfig = {
    // 请求超时时间
    timeout: 3000,
    showLoading: true,
    showErrorMessage: true,
    transform: true,
  }

  private axiosInstance: AxiosInstance

  public constructor(config: ExpandAxiosRequestConfig = {}) {
    const axiosConfig = Object.assign(this.defaultConfig, config)
    this.axiosInstance = axios.create(axiosConfig)
    this.interceptRequest()
    this.interceptResponse()
  }

  /**
   * 通用请求方法
   */
  public request<D, R>(config: ExpandAxiosRequestConfig<D>): Promise<AxiosResponse<R>> {
    return this.axiosInstance.request(config)
  }

  /**
   * get 请求
   */
  public get<D, R>(url: string, config: ExpandAxiosRequestConfig<D> = {}): Promise<R> {
    config.transform = true
    return this.axiosInstance.get(url, config)
  }

  /**
   * get 请求
   */
  public getNoTransRes<D, R>(url: string, config: ExpandAxiosRequestConfig<D> = {}): Promise<ApiResponse<R>> {
    config.transform = false
    return this.axiosInstance.get(url, config)
  }

  /**
   * post 请求
   */
  public post<D, R>(url: string, data?: D, config: ExpandAxiosRequestConfig<D> = {}): Promise<R> {
    config.transform = true
    return this.axiosInstance.post(url, data, config)
  }

  /**
   * post 请求
   */
  public postNoTransRes<D, R>(
    url: string,
    data?: D,
    config: ExpandAxiosRequestConfig<D> = {},
  ): Promise<ApiResponse<R>> {
    config.transform = false
    return this.axiosInstance.post(url, data, config)
  }

  private interceptRequest(): void {
    this.axiosInstance.interceptors.request.use(async (config: ExpandInternalAxiosRequestConfig) => {
      // token
      const token = getToken()
      if (token) {
        // 这里的 _tt 是与服务端约定的 token 键名
        config.headers._tt = token
      }

      // loadingBar
      if (config.showLoading)
        window.$loadingBar.start()

      // hook
      if (config.interceptorHooks?.beforeRequestCallback)
        config.interceptorHooks.beforeRequestCallback(config)

      return config
    }, errorHandler)
  }

  private interceptResponse(): void {
    this.axiosInstance.interceptors.response.use(async (response: ExpandAxiosResponse): Promise<any> => {
      // loadingBar
      if (response.config.showLoading)
        window.$loadingBar.finish()

      // hook
      if (response.config.interceptorHooks?.beforeResponseCallback)
        response.config.interceptorHooks.beforeResponseCallback(response)

      // transform data
      if (!response.config.transform)
        return response

      const { code, errorCode, message, data } = response.data

      if (code === successCode) {
        return data
      }
      else {
        if (response.config.showErrorMessage)
          handleErrorMessage(message)

        handleErrorCode(errorCode)
      }

      return Promise.reject(response.data)
    }, errorHandler)
  }
}
