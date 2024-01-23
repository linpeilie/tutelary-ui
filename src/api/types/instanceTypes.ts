export interface InstanceInfo {
  instanceId: string
  appName: string
  ip: string
  registerDate: string
  state: number
  startTime: string
}

export interface InstanceDetailInfo extends InstanceInfo {
  inputArguments: Array<string>
  systemPropertis: Map<string, string>
  classPath: string
  libraryPath: string
  vmVendor: string
  vmName: string
  vmVersion: string
  jdkVersion: string
}
