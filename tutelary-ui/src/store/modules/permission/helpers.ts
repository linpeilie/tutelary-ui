import type { RouteType, RoutesType } from '~/types/router'



function hasPermission(route: RouteType, authPermissions: string[]) {
  // * 不需要权限直接返回true
  if (!route.meta?.requireAuth)
    return true

  const mode = import.meta.env.MODE
  if ('development' === mode) {
    return true
  }

  // * 登录用户没有任何权限
  if (!authPermissions.length)
    return false

  // * 根据名称判断
  return authPermissions.includes(route.name)
}

export function filterAsyncRoutes(routes: RoutesType = [], authPermissions: Array<string>): RoutesType {
  const ret: RoutesType = []
  routes.forEach((route) => {
    if (hasPermission(route, authPermissions)) {
      const curRoute: RouteType = {
        ...route,
        children: [],
      }
      if (route.children && route.children.length)
        curRoute.children = filterAsyncRoutes(route.children, authPermissions) || []
      else
        Reflect.deleteProperty(curRoute, 'children')

      ret.push(curRoute)
    }
  })
  return ret
}
