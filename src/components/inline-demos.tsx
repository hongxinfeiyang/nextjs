'use client';

import { useState, useEffect } from 'react';

// ============================================================
// 第 1 章：计数器 demo
// ============================================================
export function InlineCounter() {
  const [count, setCount] = useState(0);
  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-blue-50 to-white p-5 dark:from-blue-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-brand">Live Demo</span>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">useState</span>
      </div>
      <div className="flex items-center justify-center gap-4 py-3">
        <button onClick={() => setCount(c => c - 1)} className="rounded-lg bg-red-500 px-4 py-2 text-white font-bold hover:bg-red-600 transition-all active:scale-95">-1</button>
        <span className="text-4xl font-mono font-bold tabular-nums min-w-[3ch] text-center">{count}</span>
        <button onClick={() => setCount(c => c + 1)} className="rounded-lg bg-blue-500 px-4 py-2 text-white font-bold hover:bg-blue-600 transition-all active:scale-95">+1</button>
      </div>
      <button onClick={() => setCount(0)} className="mx-auto block rounded-full border px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">重置</button>
    </div>
  );
}

// ============================================================
// 第 2 章：动态路由参数展示 demo
// ============================================================
export function InlineRouteParams() {
  const [id, setId] = useState('hello-world');
  const slugs = ['hello-world', 'getting-started', 'dynamic-routes'];
  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-green-50 to-white p-5 dark:from-green-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-green-600 dark:text-green-400">Live Demo</span>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">[id] 动态段</span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        模拟路由 <code className="rounded bg-green-100 px-1 text-xs dark:bg-green-900">/blog/{id || '[slug]'}</code>
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {slugs.map(s => (
          <button key={s} onClick={() => setId(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${id === s ? 'bg-green-500 text-white' : 'border hover:bg-green-50 dark:hover:bg-green-900'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-white dark:bg-gray-800 p-3 border">
        <p className="text-sm"><code>params.slug</code> = <strong className="text-green-600">{id}</strong></p>
        <p className="text-xs text-gray-400 mt-1">页面内容根据 slug 动态变化</p>
      </div>
    </div>
  );
}

// ============================================================
// 第 4 章：数据获取 loading → data 状态转换 demo
// ============================================================
export function InlineDataFetching() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [data, setData] = useState<string[]>([]);

  const fetchData = async () => {
    setState('loading');
    await new Promise(r => setTimeout(r, 1200));
    setData(['用户列表已加载', '张三 — admin@example.com', '李四 — user@example.com', '王五 — editor@example.com']);
    setState('done');
  };

  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-amber-50 to-white p-5 dark:from-amber-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Live Demo</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">async/await</span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">模拟 Server Component 中的数据获取</p>
      <div className="rounded-lg border bg-white dark:bg-gray-800 p-4 min-h-[100px]">
        {state === 'idle' && (
          <button onClick={fetchData} className="rounded-lg bg-brand px-4 py-2 text-sm text-white font-medium hover:bg-brand-dark transition-colors">
            获取数据
          </button>
        )}
        {state === 'loading' && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        )}
        {state === 'done' && (
          <div className="space-y-1">
            {data.map((d, i) => (
              <p key={i} className="text-sm font-mono">{d}</p>
            ))}
            <button onClick={() => { setState('idle'); setData([]); }} className="mt-2 text-xs text-brand hover:underline">重新获取</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 第 7 章：Button 变体 demo
// ============================================================
const btnVariants: Record<string, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
};

export function InlineButtonVariants() {
  const [selected, setSelected] = useState('primary');
  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-purple-50 to-white p-5 dark:from-purple-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Live Demo</span>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300">cva 变体</span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">点击按钮选择 variant，下面实时展示效果：</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(btnVariants).map(v => (
          <button key={v} onClick={() => setSelected(v)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selected === v ? 'bg-brand text-white' : 'border hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {v}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white dark:bg-gray-800 p-4">
        <button className={`inline-flex items-center justify-center rounded-md h-8 px-3 text-xs font-medium transition-colors ${btnVariants[selected]}`}>sm</button>
        <button className={`inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium transition-colors ${btnVariants[selected]}`}>md</button>
        <button className={`inline-flex items-center justify-center rounded-md h-12 px-6 text-base font-medium transition-colors ${btnVariants[selected]}`}>lg</button>
        <button disabled className={`inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium opacity-50 cursor-not-allowed ${btnVariants[selected]}`}>disabled</button>
      </div>
    </div>
  );
}

// ============================================================
// 第 6 章：useOptimistic 乐观更新 demo
// ============================================================
export function InlineOptimistic() {
  const [likes, setLikes] = useState(42);
  const [pending, setPending] = useState(false);

  const handleLike = async () => {
    setPending(true);
    setLikes(l => l + 1); // 立即更新（模拟 useOptimistic）
    await new Promise(r => setTimeout(r, 600));
    setPending(false);
  };

  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-pink-50 to-white p-5 dark:from-pink-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">Live Demo</span>
        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700 dark:bg-pink-900 dark:text-pink-300">useOptimistic</span>
      </div>
      <div className="text-center py-4">
        <p className="text-5xl font-bold mb-2">{likes}</p>
        <button
          onClick={handleLike}
          disabled={pending}
          className="rounded-full bg-pink-500 px-5 py-2 text-white font-bold hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-70"
        >
          {pending ? '发送中...' : '👍 点赞（立即 +1）'}
        </button>
        <p className="mt-2 text-xs text-gray-400">UI 立即更新，600ms 后"服务端"确认</p>
      </div>
    </div>
  );
}

// ============================================================
// 第 3 章：渲染模式选择器 demo
// ============================================================
export function InlineRenderingSelector() {
  const [mode, setMode] = useState<'ssg' | 'isr' | 'ssr' | 'csr'>('ssg');
  const [time, setTime] = useState('');

  const info: Record<string, { label: string; desc: string; color: string; time?: string }> = {
    ssg: { label: 'SSG', desc: '构建时生成，HTML 中直接包含内容。刷新时间不变。', color: 'purple', time: '2026-01-15 08:00:00 (构建时刻)' },
    isr: { label: 'ISR', desc: '先返回缓存，后台重新生成。revalidate 窗口内不变。', color: 'green', time: new Date().toLocaleString('zh-CN') + ' (缓存时间)' },
    ssr: { label: 'SSR', desc: '每次请求动态渲染。刷新时间每次都变。', color: 'blue', time: new Date().toLocaleString('zh-CN') },
    csr: { label: 'CSR', desc: '浏览器端渲染。内容在 JS 执行后出现。', color: 'orange', time: '' },
  };

  const current = info[mode];

  useEffect(() => {
    if (mode === 'csr') setTime(new Date().toLocaleString('zh-CN') + ' (客户端渲染)');
    else setTime(current.time || '');
  }, [mode, current.time]);

  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-sky-50 to-white p-5 dark:from-sky-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Live Demo</span>
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700 dark:bg-sky-900 dark:text-sky-300">渲染策略</span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">切换渲染模式，查看各自效果：</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(info) as Array<keyof typeof info>).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${mode === m ? `bg-${info[m].color}-500 text-white` : 'border hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {info[m].label}
          </button>
        ))}
      </div>
      <div className={`rounded-lg border p-4 bg-white dark:bg-gray-800`}>
        <p className="font-semibold text-sm">{current.label} 模式</p>
        <p className="text-xs text-gray-500 mt-1 mb-2">{current.desc}</p>
        {time && <p className="font-mono text-xs bg-gray-50 dark:bg-gray-900 rounded px-2 py-1">{time}</p>}
        {mode === 'csr' && !time && <p className="text-xs text-gray-400">（客户端渲染 — 时间将在组件挂载后显示）</p>}
      </div>
    </div>
  );
}

// ============================================================
// 第 5 章：Zod 校验 demo
// ============================================================
export function InlineZodValidation() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const validate = () => {
    const hasAt = email.includes('@');
    const hasDot = email.includes('.', email.indexOf('@'));
    if (!email) setResult({ ok: false, msg: '请输入邮箱' });
    else if (!hasAt || !hasDot) setResult({ ok: false, msg: '邮箱格式不正确（需要 @ 和域名）' });
    else setResult({ ok: true, msg: `校验通过：${email}` });
  };

  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-teal-50 to-white p-5 dark:from-teal-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Live Demo</span>
        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700 dark:bg-teal-900 dark:text-teal-300">Zod 校验</span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">模拟 Zod email schema 校验（实际项目用 zod 库）：</p>
      <div className="flex gap-2 mb-3">
        <input value={email} onChange={e => { setEmail(e.target.value); setResult(null); }} placeholder="输入邮箱..." className="flex-1 rounded-lg border px-3 py-2 text-sm" />
        <button onClick={validate} className="rounded-lg bg-brand px-4 py-2 text-sm text-white font-medium hover:bg-brand-dark transition-colors">校验</button>
      </div>
      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.ok ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
          {result.ok ? '✅ ' : '❌ '}{result.msg}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 第 6 章：URL 参数演示 demo
// ============================================================
export function InlineUrlParams() {
  const [params, setParams] = useState({ q: '', page: '1' });
  const url = `/products?${new URLSearchParams(params).toString()}`;
  return (
    <div className="not-prose my-6 rounded-xl border-2 border-brand/20 bg-gradient-to-br from-indigo-50 to-white p-5 dark:from-indigo-950 dark:to-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Live Demo</span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">URL 状态</span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">修改参数，观察 URL 变化。刷新页面状态不丢失。</p>
      <div className="space-y-2 mb-3">
        <input value={params.q} onChange={e => setParams(p => ({ ...p, q: e.target.value, page: '1' }))} placeholder="搜索关键字..." className="w-full rounded-lg border px-3 py-2 text-sm" />
        <div className="flex gap-2">
          {['1', '2', '3'].map(p => (
            <button key={p} onClick={() => setParams(prev => ({ ...prev, page: p }))} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${params.page === p ? 'bg-indigo-500 text-white' : 'border'}`}>第 {p} 页</button>
          ))}
        </div>
      </div>
      <div className="rounded-lg bg-gray-900 p-3">
        <code className="text-green-400 text-xs break-all">{url}</code>
      </div>
      <p className="mt-2 text-xs text-gray-400">服务端通过 searchParams 读取这些参数来筛选数据</p>
    </div>
  );
}

// ============================================================
// Demo 名称映射（供 MarkdownRenderer 使用）
// ============================================================
export const demoComponents: Record<string, React.ComponentType> = {
  'counter': InlineCounter,
  'route-params': InlineRouteParams,
  'data-fetching': InlineDataFetching,
  'button-variants': InlineButtonVariants,
  'optimistic': InlineOptimistic,
  'rendering': InlineRenderingSelector,
  'zod-validation': InlineZodValidation,
  'url-params': InlineUrlParams,
};
