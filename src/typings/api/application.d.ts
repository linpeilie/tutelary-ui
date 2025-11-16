declare namespace Api {
  namespace Application {
    interface AppInfo {
      appName: string;
      registerDate: string;
      instanceNum: number;
    }
    interface AppDetail extends AppInfo {
      instances: Api.Instance.InstanceInfo[];
    }
  }
}
