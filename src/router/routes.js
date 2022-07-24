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
    path: '/protobuf',
    component: () => import('pages/protobuf/ProtobufTest.vue'),
    title: 'Protobuf序列化',
    icon: 'article'
  }
]

export default [...PrivateRoutes, ...PublicRoutes]
