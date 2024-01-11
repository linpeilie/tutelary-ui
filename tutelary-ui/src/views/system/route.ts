import type { RouteType } from '~/types/router'

const Layout = () => import('@/layout/index.vue')

export default {
  name: 'System',
  path: '/system',
  component: Layout,
  meta: {
    title: '系统管理',
    customIcon: 'logo',
    requireAuth: true,
    order: 2,
  },
  children: [
    {
      name: 'User',
      path: 'user',
      component: () => import('@/views/system/user/list.vue'),
      meta: {
        title: '用户管理',
        icon: 'logos:unocss',
        requireAuth: true,
      },
    },
    {
      name: 'Role',
      path: 'role',
      component: () => import('@/views/system/role/list.vue'),
      meta: {
        title: '角色管理',
        requireAuth: true
      }
    }
  ],
} as RouteType
