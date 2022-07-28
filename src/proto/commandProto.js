export const COMMAND_PATH_PREF = 'src/proto/command/'
export const COMMAND_PROTO = [
  {
    type: 'arthas',
    command: 'jvm',
    proto: 'JvmCommandResultMessage',
    description: 'JVM 信息'
  },
  {
    type: 'arthas',
    command: 'dashboard',
    proto: 'DashboardCommandResultMessage',
    description: '实例面板'
  }
]
