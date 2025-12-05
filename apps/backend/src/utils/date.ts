/**
 * 日期格式化工具
 */

/**
 * 将日期格式化为人类可读格式
 * @param date 日期对象或日期字符串
 * @param format 格式类型
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'datetime' | 'date' | 'time' = 'datetime'
): string | null {
  if (!date) return null;

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

/**
 * JSON 序列化时的日期替换函数
 * 用于 Express 的 app.set('json replacer', jsonDateReplacer)
 */
export function jsonDateReplacer(key: string, value: unknown): unknown {
  // 检查是否是 ISO 8601 日期字符串格式
  if (typeof value === 'string') {
    // 匹配 ISO 8601 格式: 2023-12-05T08:00:00.000Z
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoDateRegex.test(value)) {
      return formatDate(value);
    }
  }
  return value;
}

/**
 * 获取相对时间描述
 * @param date 日期对象或日期字符串
 * @returns 相对时间描述，如 "5分钟前"、"2小时前"
 */
export function getRelativeTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else {
    return formatDate(d, 'date');
  }
}
