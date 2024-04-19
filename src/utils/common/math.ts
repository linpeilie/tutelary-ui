import Big from 'big.js'

// x + y
export function add(x: number, y: number): number {
  return new Big(x).plus(y).toNumber()
}

// x - y
export function sub(x: number, y: number): number {
  return new Big(x).minus(y).toNumber()
}

// x * y
export function mul(x: number, y: number): number {
  return new Big(x).times(y).round(2).toNumber()
}

// x / y
export function div(x: number, y: number): number {
  return new Big(x).div(y).round(2).toNumber()
}
