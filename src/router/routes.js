export const PublicRoutes = [
  {
    path: '/',
    redirect: '/app/list',
    hidden: true
  },
  {
    path: '/app/list',
    component: () => import('pages/app/AppList.vue'),
    title: '应用中心',
    icon: 'apps'
  },
  {
    path: '/instance/list',
    component: () => import('pages/instance/InstanceList.vue'),
    title: '实例列表',
    hidden: true
  },
  {
    path: '/:catchAll(.*)*',
    hidden: true,
    component: () => import('pages/ErrorNotFound.vue')
  }
]

const PrivateRoutes = [
  {
    path: '/instance',
    component: () => import('pages/instance/InstanceIndex.vue'),
    title: '实例详情',
    icon: 'monitor_heart'
  },
  {
    path: '/protobuf',
    component: () => import('pages/protobuf/ProtobufTest.vue'),
    title: 'Protobuf序列化',
    icon: 'article'
  }
]

export default [...PublicRoutes, ...PrivateRoutes]
