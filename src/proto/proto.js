export const PATH_PREF = 'src/proto/'
export const COMMAND_RESPONSE_CMD = 4
export const CMD_PROTO = [
  {
    cmd: 0,
    proto: 'ErrorMessage',
    description: '异常信息'
  },
  {
    cmd: 3,
    proto: 'ClientCommandRequestMessage',
    description: '执行命令请求参数'
  },
  {
    cmd: COMMAND_RESPONSE_CMD,
    proto: 'ClientCommandResponseMessage',
    description: '执行命令返回结果'
  }
]
