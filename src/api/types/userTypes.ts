export interface UserQuery extends QueryParam {
  username?: string
}

export interface UserInfo {
  userId: string
  username: string
  nickName: string
  phoneNumber: string
  password: string
  state: string
  loginIp?: string
  loginDate?: string
  remark?: string
}

export interface UserAddRequest {
  username: string
  nickName: string
  phoneNumber: string
  password: string
  remark?: string
}

export interface UserEditRequest {
  userId: string
  nickName: string
  phoneNumber: string
  remark?: string
}
