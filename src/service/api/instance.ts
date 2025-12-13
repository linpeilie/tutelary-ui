import { request } from '@/service/request';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;
import type { DecompileRequest } from '@/proto/command/param/DecompileRequest';

export function fetchInstanceDetail(instanceId: string) {
  return request<Api.Instance.InstanceInfo>({
    url: `/instance/detail`,
    method: 'post',
    params: {
      instanceId
    }
  });
}

export function fetchDashboardCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/overview`,
    method: 'post',
    data
  });
}

export function fetchSystemInfoCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/systemInfo`,
    method: 'post',
    data
  });
}

export function fetchSystemMetricsCommand(data: CommandCreateRequest<any>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/systemMetricsMonitoring`,
    method: 'post',
    data
  });
}

export function fetchDecompileCommand(data: CommandCreateRequest<DecompileRequest>) {
  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/decompile`,
    method: 'post',
    data
  });
}
