import type { RoleAddReq, RoleEditReq, RoleInfo, RoleQuery } from '@/api/types/roleTypes'
import { request } from '@/utils'

export default {
  rolePageQuery: (data: RoleQuery) => request.post<RoleQuery, PageResult<RoleInfo>>('/role/pageQuery', data),
  roleAdd: (data: RoleAddReq) => request.post<RoleAddReq, void>('/role/add', data),
  roleEdit: (data: RoleEditReq) => request.post<RoleEditReq, void>('/role/edit', data),
}
