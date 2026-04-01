declare namespace Api {
  namespace Application {
    interface AppInfo {
      appName: string;
      registerDate: string;
      instanceNum: number;
      onlineInstanceNum: number;
      offlineInstanceNum: number;
      hostCount: number;
      jdkVersionCount: number;
      topJdkVersions: string[];
    }
    interface AppDetail extends AppInfo {
      instances: Api.Instance.InstanceInfo[];
    }
  }
}
