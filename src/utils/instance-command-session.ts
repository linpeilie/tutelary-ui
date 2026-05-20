import { localStg } from '@/utils/storage';

function getSessions() {
  return localStg.get('instanceCommandSessions') || {};
}

export function getStoredInstanceCommandSessionId(instanceId: string) {
  return getSessions()[instanceId];
}

export function setStoredInstanceCommandSessionId(instanceId: string, sessionId: string) {
  const sessions = getSessions();
  sessions[instanceId] = sessionId;
  localStg.set('instanceCommandSessions', sessions);
}
