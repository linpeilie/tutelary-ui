export interface UserQuery {
  pageIndex: number
  pageSize: number
}

export interface UserInfo {
  userId: string
  username: string
  nickName: string
  phoneNumber: string
  state: string
  loginIp?: string
  loginDate?: string
  remark?: string
}

export interface UserAddRequest {
  username: string
  nickName: string
}
