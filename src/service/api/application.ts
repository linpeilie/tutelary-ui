import { request } from '@/service/request';

export function fetchAppList() {
  return request<Api.Application.AppInfo[]>({
    url: '/app/list',
    method: 'post',
    data: {}
  });
}

export function fetchAppDetail(appName: string) {
  return request<Api.Application.AppDetail>({
    url: '/app/detail',
    method: 'post',
    params: {
      appName
    }
  });
}
