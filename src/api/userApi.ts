import type { UserAddRequest, UserInfo, UserQuery } from './types/userTypes'
import type { PermissionInfo } from './types/permissionTypes'
import { request } from '@/utils'

export default {
  getUser: () => request.post<never, UserInfo>('user/info'),
  getPermissions: () => request.post<never, Array<PermissionInfo>>('user/permissions'),
  userPageQuery: (data: UserQuery) => request.post<UserQuery, UserInfo>('user/pageQuery', data),
  userAdd: (data: UserAddRequest) => request.post<UserAddRequest, void>('user/add', data),
}
