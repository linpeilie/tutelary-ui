import type { RouteType } from '~/types/router'

const Layout = () => import('@/layout/index.vue')

export default {
  name: 'App',
  path: '/app',
  component: Layout,
  redirect: '/app/list',
  meta: {
    title: '应用',
    requireAuth: true,
    order: 3,
  },
  children: [
    {
      name: 'AppList',
      path: 'list',
      component: () => import('@/views/app/appList.vue'),
      meta: {
        title: '应用列表',
        requireAuth: true,
        icon: 'fluent:app-folder-48-filled',
      },
    },
  ],
} as RouteType
