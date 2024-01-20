import { defineStore } from 'pinia'
import { removeToken, toLogin } from '@/utils'
import { usePermissionStore, useTabStore } from '@/store'
import { resetRouter } from '@/router'
import api from '@/api/userApi'

import { permissionType__Menu, permissionType__Resource } from '~/src/enums/permissionEnums'

interface UserInfo {
  userId?: string
  username?: string
  nickName?: string
  avatar?: string
}

export const useUserStore = defineStore('user', {
  state() {
    return {
      userInfo: <UserInfo>{},
      menus: [] as string[],
      resources: [] as string[],
    }
  },
  getters: {
    userId(): string {
      return this.userInfo.userId || ''
    },
    name(): string {
      return this.userInfo.username || ''
    },
    nickName(): string {
      return this.userInfo.nickName || ''
    },
    avatar(): string {
      return this.userInfo.avatar || ''
    },
    routes(): Array<string> {
      return this.menus || []
    },
  },
  actions: {
    async getUserInfo() {
      try {
        const res = await api.getUser()
        const { userId, username, nickName } = res
        this.userInfo = { userId, username, nickName }
        return Promise.resolve(res)
      }
      catch (error) {
        return Promise.reject(error)
      }
    },
    async getPermissions() {
      try {
        const permissions = await api.getPermissions()
        this.menus = permissions
          .filter(permission => permission.permissionType === permissionType__Menu)
          .map(permission => permission.identification)
        this.resources = permissions
          .filter(permission => permission.permissionType === permissionType__Resource)
          .map(permission => permission.identification)
        return Promise.resolve(permissions)
      }
      catch (error) {
        return Promise.reject(error)
      }
    },
    async logout() {
      const { resetTabs } = useTabStore()
      const { resetPermission } = usePermissionStore()
      removeToken()
      resetPermission()
      resetTabs()
      resetRouter()
      this.$reset()
      toLogin()
    },
    setUserInfo(userInfo = {}) {
      this.userInfo = { ...this.userInfo, ...userInfo }
    },
  },
})
