import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import Big from 'big.js';
import { $t } from '@/locales';

// 定义常量
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const YEAR_MS = 365 * DAY_MS; // 简单起见，不考虑闰年

/**
 * 计算并格式化时间差
 * @param start 开始时间
 * @param end 结束时间（可选，默认为当前时间）
 * @returns 格式化后的时间差字符串
 */
export function formatTimeDifference(start: Dayjs | Date | string, end?: Dayjs | Date | string): string {
  const startTime = dayjs(start);
  const endTime = end ? dayjs(end) : dayjs();

  // 计算毫秒差，使用big.js避免精度问题
  const diffMs = new Big(endTime.valueOf()).minus(startTime.valueOf());

  // 处理负数（如果开始时间晚于结束时间）
  const isNegative = diffMs.lt(0);
  const absDiffMs = diffMs.abs();

  // 根据时间差范围进行格式化
  if (absDiffMs.lt(SECOND_MS)) {
    // 小于1秒：显示毫秒
    return formatMilliseconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(MINUTE_MS)) {
    // 小于1分钟：显示秒
    return formatSeconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(HOUR_MS)) {
    // 小于1小时：显示分钟和秒
    return formatMinutesAndSeconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(DAY_MS)) {
    // 小于1天：显示小时、分钟、秒
    return formatHoursMinutesSeconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(YEAR_MS)) {
    // 小于1年：显示天、小时、分钟
    return formatDaysHoursMinutes(absDiffMs, isNegative);
  }
  // 大于等于1年：显示年、天
  return formatYearsDays(absDiffMs, isNegative);
}

/**
 * 格式化毫秒
 */
function formatMilliseconds(ms: Big, isNegative: boolean): string {
  const prefix = isNegative ? '-' : '';
  return `${prefix}${ms.toFixed(0)}${$t('common.timeUnit.millisecond')}`;
}

/**
 * 格式化秒
 */
function formatSeconds(ms: Big, isNegative: boolean): string {
  const seconds = ms.div(SECOND_MS);
  const prefix = isNegative ? '-' : '';

  // 如果秒数小于10，保留1位小数，否则取整数
  if (seconds.lt(10)) {
    return `${prefix}${seconds.toFixed(1)}${$t('common.timeUnit.second')}`;
  }
  return `${prefix}${seconds.round(0, 0).toString()}${$t('common.timeUnit.second')}`;
}

/**
 * 格式化分钟和秒
 */
function formatMinutesAndSeconds(ms: Big, isNegative: boolean): string {
  const minutes = ms.div(MINUTE_MS).round(0, 0); // 向下取整
  const remainingMs = ms.mod(MINUTE_MS);
  const seconds = remainingMs.div(SECOND_MS).round(0, 0);
  const prefix = isNegative ? '-' : '';

  return `${prefix}${minutes}${$t('common.timeUnit.minute')}${seconds}${$t('common.timeUnit.second')}`;
}

/**
 * 格式化小时、分钟、秒
 */
function formatHoursMinutesSeconds(ms: Big, isNegative: boolean): string {
  const hours = ms.div(HOUR_MS).round(0, 0);
  const remainingAfterHours = ms.mod(HOUR_MS);
  const minutes = remainingAfterHours.div(MINUTE_MS).round(0, 0);
  const remainingAfterMinutes = remainingAfterHours.mod(MINUTE_MS);
  const seconds = remainingAfterMinutes.div(SECOND_MS).round(0, 0);
  const prefix = isNegative ? '-' : '';

  return `${prefix}${hours}${$t('common.timeUnit.hour')}${minutes}${$t('common.timeUnit.minute')}${seconds}${$t('common.timeUnit.second')}`;
}

/**
 * 格式化天、小时、分钟
 */
function formatDaysHoursMinutes(ms: Big, isNegative: boolean): string {
  const days = ms.div(DAY_MS).round(0, 0);
  const remainingAfterDays = ms.mod(DAY_MS);
  const hours = remainingAfterDays.div(HOUR_MS).round(0, 0);
  const remainingAfterHours = remainingAfterDays.mod(HOUR_MS);
  const minutes = remainingAfterHours.div(MINUTE_MS).round(0, 0);
  const prefix = isNegative ? '-' : '';

  return `${prefix}${days}${$t('common.timeUnit.day')}${hours}${$t('common.timeUnit.hour')}${minutes}${$t('common.timeUnit.minute')}`;
}

/**
 * 格式化年、天
 */
function formatYearsDays(ms: Big, isNegative: boolean): string {
  const years = ms.div(YEAR_MS).round(0, 0);
  const remainingAfterYears = ms.mod(YEAR_MS);
  const days = remainingAfterYears.div(DAY_MS).round(0, 0);
  const prefix = isNegative ? '-' : '';

  return `${prefix}${years}${$t('common.timeUnit.year')}${days}${$t('common.timeUnit.day')}`;
}

// 扩展版本：返回包含详细信息的对象
export interface FormattedTimeDifference {
  formatted: string;
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMilliseconds: number;
}

/**
 * 返回详细的时间差信息
 */
export function getTimeDifferenceDetails(
  start: Dayjs | Date | string,
  end?: Dayjs | Date | string
): FormattedTimeDifference {
  const startTime = dayjs(start);
  const endTime = end ? dayjs(end) : dayjs();

  const diffMs = new Big(endTime.valueOf()).minus(startTime.valueOf());
  const isNegative = diffMs.lt(0);
  const absDiffMs = diffMs.abs();

  // 计算各个单位的值
  const years = absDiffMs.div(YEAR_MS).round(0, 0).toNumber();
  const remainingAfterYears = absDiffMs.mod(YEAR_MS);
  const days = remainingAfterYears.div(DAY_MS).round(0, 0).toNumber();
  const remainingAfterDays = remainingAfterYears.mod(DAY_MS);
  const hours = remainingAfterDays.div(HOUR_MS).round(0, 0).toNumber();
  const remainingAfterHours = remainingAfterDays.mod(HOUR_MS);
  const minutes = remainingAfterHours.div(MINUTE_MS).round(0, 0).toNumber();
  const remainingAfterMinutes = remainingAfterHours.mod(MINUTE_MS);
  const seconds = remainingAfterMinutes.div(SECOND_MS).round(0, 0).toNumber();
  const milliseconds = remainingAfterMinutes.mod(SECOND_MS).round(0, 0).toNumber();

  // 根据时间差范围选择格式
  let formatted: string;
  if (absDiffMs.lt(SECOND_MS)) {
    formatted = formatMilliseconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(MINUTE_MS)) {
    formatted = formatSeconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(HOUR_MS)) {
    formatted = formatMinutesAndSeconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(DAY_MS)) {
    formatted = formatHoursMinutesSeconds(absDiffMs, isNegative);
  } else if (absDiffMs.lt(YEAR_MS)) {
    formatted = formatDaysHoursMinutes(absDiffMs, isNegative);
  } else {
    formatted = formatYearsDays(absDiffMs, isNegative);
  }

  return {
    formatted,
    years,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    totalMilliseconds: Number.parseInt(diffMs.toString(), 10)
  };
}
