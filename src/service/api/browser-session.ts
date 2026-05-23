import { request } from '@/service/request';

interface BrowserInstanceSessionRequest {
  instanceId: string;
  sessionId?: string;
}

interface BrowserSessionEnhanceTasksRequest {
  instanceId: string;
  sessionId: string;
  commandCode?: number;
}

export function issueBrowserInstanceSession(data: BrowserInstanceSessionRequest) {
  return request<Api.Instance.Command.BrowserInstanceSessionResponse>({
    url: '/browser/instance-session/issue',
    method: 'post',
    data
  });
}

export function bindBrowserInstanceSession(data: Required<BrowserInstanceSessionRequest>) {
  return request<Api.Instance.Command.BrowserInstanceSessionResponse>({
    url: '/browser/instance-session/bind',
    method: 'post',
    data
  });
}

export function fetchBrowserSessionEnhanceTasks(data: BrowserSessionEnhanceTasksRequest) {
  return request<Api.Instance.Command.BrowserSessionEnhanceTaskResponse[]>({
    url: '/browser/instance-session/enhance-tasks',
    method: 'post',
    data
  });
}

export function fetchBrowserSessionTraceSession(data: Pick<BrowserSessionEnhanceTasksRequest, 'instanceId' | 'sessionId'>) {
  return request<Api.Instance.Command.BrowserSessionEnhanceTaskResponse | null>({
    url: '/browser/instance-session/trace-session',
    method: 'post',
    data
  });
}

export function fetchBrowserSessionStackSession(data: Pick<BrowserSessionEnhanceTasksRequest, 'instanceId' | 'sessionId'>) {
  return request<Api.Instance.Command.BrowserSessionEnhanceTaskResponse | null>({
    url: '/browser/instance-session/stack-session',
    method: 'post',
    data
  });
}
