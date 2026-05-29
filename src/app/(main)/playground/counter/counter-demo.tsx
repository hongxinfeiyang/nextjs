'use client';

import { useState, useEffect } from 'react';

export function CounterDemo() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState<number[]>([]);

  // 监听 count 变化记录历史
  useEffect(() => {
    if (count !== 0) setHistory(h => [...h.slice(-9), count]);
  }, [count]);

  return (
    <div className="space-y-8">
      {/* 基础计数器 */}
      <div className="rounded-xl border p-6 text-center">
        <p className="mb-1 text-sm text-gray-500">useState 计数器</p>
        <p className="mb-4 text-7xl font-mono font-bold tabular-nums">{count}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCount(c => c - step)}
            className="rounded-lg bg-red-500 px-5 py-2.5 text-white font-medium hover:bg-red-600 transition-colors"
          >
            -{step}
          </button>
          <button
            onClick={() => setCount(0)}
            className="rounded-lg border px-4 py-2.5 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            重置
          </button>
          <button
            onClick={() => setCount(c => c + step)}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            +{step}
          </button>
        </div>
      </div>

      {/* 步长控制 */}
      <div className="rounded-xl border p-6">
        <p className="mb-3 text-sm text-gray-500">步长控制（演示 useState 联动）</p>
        <div className="flex gap-2">
          {[1, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                step === s ? 'bg-brand text-white' : 'border hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 历史记录 — 演示 useEffect */}
      <div className="rounded-xl border p-6">
        <p className="mb-3 text-sm text-gray-500">操作历史（useEffect 监听变化）</p>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">暂无操作记录</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-mono dark:bg-gray-800">
                {h > 0 ? `+${h}` : h}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 代码提示 */}
      <details className="rounded-xl border">
        <summary className="cursor-pointer p-4 font-medium text-sm text-gray-500 select-none">查看源码结构</summary>
        <pre className="border-t bg-gray-50 p-4 text-xs overflow-x-auto dark:bg-gray-900">
{`'use client';
import { useState, useEffect } from 'react';

export function CounterDemo() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (count !== 0) setHistory(h => [...h.slice(-9), count]);
  }, [count]);

  return (
    <button onClick={() => setCount(c => c + step)}>
      {count}
    </button>
  );
}`}</pre>
      </details>
    </div>
  );
}
