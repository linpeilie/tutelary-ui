import { UserQuery, UserInfo, UserAddRequest } from './types/userTypes'
import { PermissionInfo } from './types/permissionTypes'
import { request } from '@/utils'

export default {
  getUser: () => request.post<never, UserInfo>('user/info'),
  getPermissions: () => request.post<never, Array<PermissionInfo>>('user/permissions'),
  userPageQuery: (data: UserQuery) => request.post<UserQuery, UserInfo>('user/pageQuery', data),
  userAdd: (data: UserAddRequest) => request.post<UserAddRequest, void>('user/add', data),
}
