import type { RouteType } from '~/types/router'

function Layout() {
  return import('@/layout/index.vue')
}

export default {
  name: 'Instance',
  path: '/instance',
  component: Layout,
  meta: {
    title: '应用实例',
    requireAuth: true,
    order: 3,
  },
  isHidden: true,
  children: [
    {
      name: 'InstanceList',
      path: 'appInstanceList/:appName',
      component: () => import('@/views/instance/instanceList.vue'),
      meta: {
        title: '实例列表',
        requireAuth: true,
      },
      isHidden: true,
    },
  ],
} as RouteType
