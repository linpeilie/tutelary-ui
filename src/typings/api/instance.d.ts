declare namespace Api {
  namespace Instance {
    interface InstanceInfo {
      instanceId: string;
      appName: string;
      ip: string;
      registerDate: string;
      state: number;
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
