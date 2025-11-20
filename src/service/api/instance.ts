import { request } from '@/service/request';
import CommandCreateRequest = Api.Instance.Command.CommandCreateRequest;

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
