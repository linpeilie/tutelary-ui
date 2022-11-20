export const COMMAND_PATH_PREF = 'src/proto/command/'
export const TYPE_ARTHAS = 1
export const TYPE_TUTELARY = 2
export const COMMAND_PROTO = [
  { type: '2', command: '20010', result: 'Overview', description: 'instance overview' },
  { type: '2', command: '20011', param: 'ThreadListParam', result: 'ThreadList', description: 'thread base info list' },
  { type: '2', command: '21010', result: 'EnhanceAffect', description: 'enhance affect' },
  { type: '2', command: '21011', param: 'TraceParam', result: 'TraceResult', description: 'trace method' },
  { type: '2', command: '21099', result: 'EnhanceCommandComplete', description: 'enhance command complete hint' }
]
