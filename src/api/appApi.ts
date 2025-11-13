import type { AppInfo, AppQueryRequest } from '@/api/types/appTypes'
import { request } from '@/utils'

export default {
  appPageQuery: (data: AppQueryRequest) => request.post<AppQueryRequest, PageResult<AppInfo>>('app/pageQuery', data),
  appList: (data: AppQueryRequest) => request.post<AppQueryRequest, AppInfo[]>('app/list', data),
}
