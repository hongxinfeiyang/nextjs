// ============================================================================
// useDebounce 自定义 Hook
// ============================================================================
// 对频繁变化的值进行防抖处理，在指定的延迟时间内如果值未再次变化才更新。
// 典型使用场景：搜索输入框实时防抖，避免每次按键都触发 API 请求。
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * 防抖 Hook
 *
 * 在指定的 delay（毫秒）内，如果 value 未发生新的变化，才将最新值同步到
 * debouncedValue 中返回。如果 delay 内 value 再次更新，则重新计时。
 *
 * @template T   - 需要进行防抖的值类型（泛型，支持任意类型）
 * @param value   - 需要防抖的原始值
 * @param delay   - 防抖延迟时间（毫秒），默认 300ms
 * @returns 经过防抖处理后的值（仅当 value 在 delay 时间内稳定不变时更新）
 *
 * @example
 * // 搜索输入框防抖示例
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500); // 500ms 后再触发搜索
 * useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  // 维护防抖后的值，初始值与传入的 value 相同
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // 设置定时器：在 delay 毫秒后将 value 更新到 debouncedValue
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // 清理函数：如果 value 或 delay 在定时器到期前发生变化，取消旧定时器
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
