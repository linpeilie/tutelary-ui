import { AxiosRequest } from './AxiosRequest'

export const request = new AxiosRequest({
  baseURL: import.meta.env.VITE_BASE_API,
})
