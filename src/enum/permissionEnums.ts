import { EnumItem } from '@/utils/enum';

export const permissionTypeEnum = Object.freeze({
  MENU: EnumItem.of('M', '菜单'),
  RESOURCE: EnumItem.of('R', '资源')
} as const);
