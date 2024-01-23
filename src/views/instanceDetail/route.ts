import type { RouteType } from '~/types/router'

function AppMain() {
  return import('@/layout/AppMain.vue')
}

export default {
  name: 'InstanceDetail',
  path: '/instance-detail',
  component: AppMain,
  meta: {
    title: '应用实例详情',
    requireAuth: true,
    order: 3,
  },
  isHidden: true,
  children: [
    {
      name: 'InstanceDetailIndex',
      path: ':instanceId',
      component: () => import('@/views/instanceDetail/index.vue'),
      meta: {
        title: '应用实例详情',
        requireAuth: true,
      },
      isHidden: true,
    },
  ],
} as RouteType
