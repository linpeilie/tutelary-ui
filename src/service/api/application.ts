import { request } from '@/service/request';

export function fetchAppList() {
  return request<Api.Application.AppInfo[]>({
    url: '/app/list',
    method: 'post',
    data: {}
  });
}
