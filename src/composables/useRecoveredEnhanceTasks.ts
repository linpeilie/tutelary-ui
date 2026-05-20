import { fetchBrowserSessionEnhanceTasks } from '@/service/api/browser-session';
import { getStoredInstanceCommandSessionId } from '@/utils/instance-command-session';
import type { CommandExecuteResponse } from '@/proto/CommandExecuteResponse';

export async function recoverEnhanceTaskResults<T>(
  instanceId: string,
  commandCode: number,
  handleResult: (response: CommandExecuteResponse<T>) => void
) {
  const sessionId = getStoredInstanceCommandSessionId(instanceId);
  if (!sessionId) return [];

  const response = await fetchBrowserSessionEnhanceTasks({
    instanceId,
    sessionId,
    commandCode
  });

  const tasks = response.data || [];
  tasks.forEach(task => {
    task.results?.forEach(result => {
      handleResult({
        taskId: task.taskId,
        code: task.commandCode,
        status: true,
        data: result as T
      } as CommandExecuteResponse<T>);
    });
  });

  return tasks;
}
