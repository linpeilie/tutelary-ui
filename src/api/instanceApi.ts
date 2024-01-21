import type { InstanceInfo } from '@/api/types/instanceTypes'
import { request } from '@/utils'

export default {
  listByAppName: (appName: string) => request.postForm<any, InstanceInfo>('instance/listByAppName', { appName }),
}
