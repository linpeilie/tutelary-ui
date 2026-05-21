import { request } from '@/service/request';
import { getStoredInstanceCommandSessionId } from '@/utils/instance-command-session';

export type EmptyCommandParam = Record<string, never>;
export type RestCommandCreateRequest<TParam = EmptyCommandParam> = Api.Instance.Command.CommandCreateRequest<TParam>;

export function createRestCommand<TParam = EmptyCommandParam>(commandName: string, data: RestCommandCreateRequest<TParam>) {
  const browserSessionId = data.browserSessionId || getStoredInstanceCommandSessionId(data.instanceId);
  const payload = browserSessionId ? { ...data, browserSessionId } : data;

  return request<Api.Instance.Command.CommandTaskResponse>({
    url: `/command/creation/${commandName}`,
    method: 'post',
    data: payload
  });
}
