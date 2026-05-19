declare namespace Api {
  namespace Instance {
    interface InstanceInfo {
      instanceId: string;
      tenantId?: string;
      appName: string;
      env?: string;
      region?: string;
      zone?: string;
      ip: string;
      registerDate: string;
      state: number;
      online?: boolean;
      startTime: string;
      vmVendor: string;
      vmName: string;
      vmVersion: string;
      jdkVersion: string;
      hostName: string;
      osName: string;
      arch: string;
      availableProcessors: number;
      memorySize: number;
      runtimeStatus?: 'REGISTERING' | 'ONLINE' | 'DRAINING' | 'SUSPECT' | 'TEMP_OFFLINE' | 'PERMANENT_OFFLINE' | 'DELETED' | string;
      ownerNodeId?: string;
      sessionId?: string;
      ownerEpoch?: number;
      runtimeId?: string;
      bootId?: string;
      lastSeenAt?: string;
      leaseExpireAt?: string;
      suspectAt?: string;
      offlineAt?: string;
      permanentAt?: string;
      reason?: string;
    }
    namespace Command {
      interface CommandCreateRequest<T> {
        instanceId: string;
        param?: T;
      }
      interface CommandTaskResponse {
        commandCode: number;
        instanceId: string;
        taskId: string;
        param: string;
        completeTime: string;
      }
    }
  }
}
