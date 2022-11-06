import _ from 'lodash'

/**
 * 两个数相除
 * @param dividend  相除的第一个数
 * @param divisor   相除的第二个数
 * @param precision 精度（保留几位小数）
 */
export const divide = (dividend, divisor, precision = 0) => {
  return _.floor(_.divide(dividend, divisor), precision)
}
