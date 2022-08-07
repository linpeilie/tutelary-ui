export const COMMAND_PATH_PREF = 'src/proto/command/'
export const TYPE_ARTHAS = 1
export const TYPE_TUTELARY = 2
export const dashboardCommandCode = 10010
export const threadListCommandCode = 10020
export const threadStackTraceCommandCode = 10021
export const blockingThreadCommandCode = 10022
export const COMMAND_PROTO = [
  {
    type: TYPE_ARTHAS,
    command: 'jvm',
    commandCode: 10030,
    proto: 'JvmCommandResultMessage',
    description: 'JVM 信息'
  },
  {
    type: TYPE_ARTHAS,
    command: 'dashboard',
    commandCode: dashboardCommandCode,
    proto: 'DashboardCommandResultMessage',
    description: '实例面板'
  },
  {
    type: TYPE_ARTHAS,
    command: 'thread',
    commandCode: threadListCommandCode,
    proto: 'ThreadListCommandResultMessage',
    description: '线程列表'
  },
  {
    type: TYPE_ARTHAS,
    command: 'thread',
    commandCode: threadStackTraceCommandCode,
    proto: 'ThreadStackTraceCommandResultMessage',
    description: '线程堆栈信息'
  },
  {
    type: TYPE_ARTHAS,
    command: 'thread',
    commandCode: blockingThreadCommandCode,
    proto: 'BlockingThreadCommandResultMessage',
    description: '线程锁阻塞信息'
  }
]
