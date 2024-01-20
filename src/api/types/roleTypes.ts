export interface RoleQuery extends QueryParam {
  roleName?: string
  enableStatus?: number
}

export interface RoleInfo {
  roleId: string
  roleName: string
  enableStatus: number
  remark: string
}

export interface RoleAddReq {
  roleName: string
  enableStatus: number
  remark?: string
}

export interface RoleEditReq {
  roleId: string
  roleName: string
  enableStatus: number
  remark?: string
}
