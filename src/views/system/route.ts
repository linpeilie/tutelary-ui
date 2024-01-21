import type { RouteType } from '~/types/router'

const Layout = () => import('@/layout/index.vue')

export default {
  name: 'System',
  path: '/system',
  component: Layout,
  meta: {
    title: '系统管理',
    requireAuth: true,
    icon: 'line-md:list-3-filled',
    order: 2,
  },
  children: [
    {
      name: 'User',
      path: 'user',
      component: () => import('@/views/system/user/list.vue'),
      meta: {
        title: '用户管理',
        requireAuth: true,
      },
    },
    {
      name: 'Role',
      path: 'role',
      component: () => import('@/views/system/role/list.vue'),
      meta: {
        title: '角色管理',
        requireAuth: true,
      },
    },
  ],
} as RouteType
