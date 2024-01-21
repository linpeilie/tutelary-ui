declare global {
  type EnumLabel = string
  type EnumValue = number | string
  interface EnumValueTag {
    color?: string
    type?: 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
  }
}

export {}