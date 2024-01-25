export interface CommandCreateRequest<T> {
  instanceId: string
  param: T
}

export interface CommandTaskResponse {
  commandCode: number
  instanceId: string
  taskId: string
  param: string
  completeTime: string
}

export interface ThreadListRequest {
  samplerInterval: number
}
