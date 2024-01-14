import { createEnum } from "@/utils/common/enum"

export const permissionType__Menu = 'M'
export const permissionType__Resource = 'R'

export const permissionTypeEnum = createEnum([
  {
    label: '菜单',
    value: permissionType__Menu
  },
  {
    label: '资源',
    value: permissionType__Resource
  }
] as const)