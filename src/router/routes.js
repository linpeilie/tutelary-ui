export const PublicRoutes = [
  {
    path: '/:catchAll(.*)*',
    hidden: true,
    component: () => import('pages/ErrorNotFound.vue')
  }
]

const PrivateRoutes = [
  {
    path: '/app/list',
    component: () => import('pages/app/AppList.vue'),
    title: '应用列表',
    icon: 'apps'
  },
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

export default [...PrivateRoutes, ...PublicRoutes]
