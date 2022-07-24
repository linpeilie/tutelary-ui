import { api } from 'src/boot/axios'

export function getAction (url, params) {
  return api.get(url, params)
}

export function postAction (url, data) {
  return api.post(url, data)
}
