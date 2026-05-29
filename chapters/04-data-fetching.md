# 第四章：数据获取 — Server Components 与缓存策略

---

## 4.1 Server Components 中的数据获取

Server Components 的核心优势：**直接在组件中 `await` 数据**，无需 `useEffect`，无需额外的数据获取库。

### 基本模式

```tsx
// src/app/posts/page.tsx
export default async function PostsPage() {
  // 直接 fetch，Next.js 自动缓存、去重
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  return (
    <ul>
      {posts.map((post: { id: string; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### 与 Pages Router 时代的关键区别

| 对比维度 | Pages Router (getServerSideProps) | App Router |
|---------|-----------------------------------|------------|
| 数据获取位置 | 页面级 `getServerSideProps` | 组件级，任何层级 |
| 数据传递 | 通过 props 逐层传递 | 组件内部直接获取 |
| 代码位置 | 与组件分离 | 数据获取与 UI 放在一起 |
| 并行请求 | 手动 `Promise.all` | 组件级自动流式加载 |

### 直接访问数据库

```tsx
// src/app/users/page.tsx
import { db } from '@/lib/db';

export default async function UsersPage() {
  // Server Component 中可以直接访问数据库
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} — {user.email}
        </li>
      ))}
    </ul>
  );
}
```

> **安全：** Server Component 的代码永远不会发送到客户端，所以在这里使用数据库凭据是安全的。

---

## 4.2 扩展的 `fetch` API

> **Next.js 16 重要变更：`fetch()` 默认不再缓存！** 必须显式设置 `cache: 'force-cache'` 才会被缓存，否则每次请求都从源获取。

### `cache: 'force-cache'` — 需显式开启

```tsx
// Next.js 16：fetch 默认不缓存（这是与 15 最大的区别！）
// ❌ Next.js 15 中这行代码会自动缓存
// ✅ Next.js 16 中这行代码每次请求都重新获取
const data = await fetch('https://api.example.com/data');

// 需要缓存必须显式声明：
const cached = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
});
```

### `cache: 'no-store'` — 每次都请求（16 中这是默认行为）

```tsx
// Next.js 16 中默认等同于这个
const data = await fetch('https://api.example.com/realtime', {
  cache: 'no-store',
});
```

### `next.revalidate` — 基于时间的缓存

```tsx
// 缓存 60 秒，之后过期
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },
});
```

### `next.tags` — 基于标签的缓存

```tsx
// 给这个请求打标签，后续按需失效
const data = await fetch('https://api.example.com/products', {
  next: { tags: ['products'] },
});
```

### fetch 选项对比

| 选项 | 行为 | Next.js 16 中的默认？ |
|------|------|---------------------|
| `cache: 'force-cache'` | 缓存 | ❌ 需显式开启 |
| `cache: 'no-store'` | 不缓存 | ✅ 这是新默认 |
| `next: { revalidate: N }` | N 秒后过期 | 需显式设置 |
| `next: { tags: [...] }` | 按标签缓存 | 需显式设置 |

### Next.js 16 新缓存模型：`"use cache"` 指令

Next.js 16 引入了全新的显式缓存体系。`"use cache"` 是一个编译器级别的指令（类似 `"use client"`），标记函数为可缓存。

```ts
// next.config.ts — 必须先开启
const nextConfig: NextConfig = {
  cacheComponents: true,
};
```

```ts
import { cacheLife, cacheTag } from 'next/cache';

// 缓存数据库查询
export async function getProducts() {
  "use cache";                    // ← 标记该函数可缓存
  cacheLife("hours");             // 缓存策略
  cacheTag("products");           // 缓存标签（用于后续失效）

  return db.product.findMany({ orderBy: { createdAt: 'desc' } });
}

// 缓存外部 API 请求
export async function getExternalData(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`external-${id}`);

  return fetch(`https://api.example.com/data/${id}`, {
    cache: 'force-cache',  // fetch 缓存需双选
  }).then(r => r.json());
}
```

### `cacheLife` 策略

| 内置策略 | stale (客户端) | revalidate (服务端) | expire (过期) |
|---------|---------------|-------------------|--------------|
| `"seconds"` | 30s | 1s | 1 min |
| `"minutes"` | 5 min | 1 min | 1 hour |
| `"hours"` | 5 min | 1 hour | 1 day |
| `"days"` | 5 min | 1 day | 1 week |
| `"weeks"` | 5 min | 1 week | 30 days |
| `"max"` | 5 min | 30 days | never |

### 新的缓存失效 API

```ts
'use server';

import { revalidateTag, updateTag } from 'next/cache';

// Next.js 15: revalidateTag('products') — 单参数
// Next.js 16: 必须多传一个参数指定刷新策略
revalidateTag('products', 'max');    // 强制刷新到最新
// 或者自定义：
revalidateTag('products', { expire: 0 });

// 新 API：updateTag — 立即清理客户端缓存（读你所写）
export async function updateProduct(id: string) {
  "use server";
  await db.product.update({ where: { id }, data });
  updateTag(`product-${id}`);  // 客户端立即可见新数据
}
```

### `"use cache"` vs `React.cache()`

| | `React.cache()` | `"use cache"` |
|---|---|---|
| 作用范围 | 单次请求去重 | 跨请求持久缓存 |
| 存储位置 | 请求内存 | Data Cache (磁盘/Redis) |
| 有效期 | 请求结束即释放 | 按 cacheLife 策略 |
| 可手动失效 | 否 | 是（revalidateTag） |
| Next.js 16 推荐 | 请求去重场景 | 数据缓存场景 |

---

## 4.3 缓存体系详解

**Next.js 16 的新缓存层：**

```
浏览器
  ├─ Router Cache (客户端内存, ~30s)
  │     ↓
  ├─ Full Route Cache (服务端, 静态页面 HTML/RSC)
  │     ↓
  ├─ Data Cache (服务端, "use cache" + fetch 缓存, 跨请求持久化)
  │     ↓
  └─ 数据源 (数据库 / API / CMS)
```

旧版缓存（Next.js 15）：

### Data Cache（数据缓存）

- **作用范围：** 跨请求、跨部署
- **存储位置：** 服务端
- **有效期：** 永久有效（除非手动失效或 revalidate）
- **何时失效：** `revalidateTag()` / `revalidatePath()` / 达到 `revalidate` 时间

### Full Route Cache（全路由缓存）

- **作用范围：** 静态渲染的页面
- **存储位置：** 服务端
- **有效期：** 与 Data Cache 关联的 fetch 的 revalidate 一致
- **特点：** 只有静态页面（SSG/ISR）才有这层缓存

### Router Cache（客户端路由缓存）

- **作用范围：** 用户浏览器内存
- **有效期：** 默认约 30 秒或用户导航离开
- **特点：** 存储已访问页面的 RSC payload，让后退导航瞬间完成

---

## 4.4 按需验证缓存

### `revalidateTag`

```ts
// src/app/actions.ts
'use server';

import { revalidateTag } from 'next/cache';

export async function updatePost(postId: string, data: FormData) {
  // 更新数据库
  await db.post.update({ where: { id: postId }, data });

  // 让所有打了这些标签的 fetch 缓存失效
  revalidateTag('posts');
  revalidateTag(`post-${postId}`);
}
```

### `revalidatePath`

```ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(data: FormData) {
  await db.post.create({ data });

  // 让指定路径的页面缓存失效
  revalidatePath('/posts');      // 重新生成 /posts 页面
  revalidatePath('/posts', 'layout'); // 重新生成 /posts 这个 layout 及其子页面
  revalidatePath('/posts', 'page');   // 只重新生成 /posts 的 page
}
```

### 两者对比

| 特性 | `revalidateTag` | `revalidatePath` |
|------|----------------|-------------------|
| 影响范围 | 精确（按标签） | 宽泛（按路径） |
| 使用场景 | 数据层面 | 页面层面 |
| 管理复杂度 | 需要维护标签 | 简单直接 |

---

## 4.5 并行数据请求

App Router 的最大优势之一是**自动请求去重**和**组件级数据获取**。

### 问题场景：请求瀑布流

```tsx
// ❌ 坏：串行请求 — 总耗时 = 2s + 1s + 0.5s = 3.5s
export default async function Page() {
  const user = await fetch('/api/user');           // 2s
  const posts = await fetch('/api/posts');         // 1s
  const comments = await fetch('/api/comments');   // 0.5s
  // ...
}
```

### 解决方案一：`Promise.all`

```tsx
// ✅ 好：并行请求 — 总耗时 = max(2s, 1s, 0.5s) = 2s
export default async function Page() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json()),
  ]);
  // ...
}
```

### 解决方案二：组件级数据获取（更优）

```tsx
// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { UserProfile, UserProfileSkeleton } from './user-profile';
import { RecentPosts, RecentPostsSkeleton } from './recent-posts';
import { Comments, CommentsSkeleton } from './comments';

export default function DashboardPage() {
  return (
    <div className="grid gap-4">
      {/* 三个组件独立请求，互不阻塞，各自流式加载 */}
      <Suspense fallback={<UserProfileSkeleton />}>
        <UserProfile />
      </Suspense>
      <Suspense fallback={<RecentPostsSkeleton />}>
        <RecentPosts />
      </Suspense>
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}
```

每个组件各自 `await` 自己的数据，互不阻塞，最先完成的先展示。

---

## 4.6 React `cache()` 与请求去重

Next.js 会自动对同一渲染中的**相同 fetch 请求**去重（Deduplication）。但对于直接数据库调用，需要手动 `cache()`：

```tsx
// src/lib/db.ts
import { cache } from 'react';

// 用 React cache() 包裹，确保同一渲染中多次调用只执行一次
export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } });
});
```

```tsx
// 场景：多个组件需要同一个 user 数据
// src/app/profile/page.tsx
import { getUser } from '@/lib/db';

export default async function ProfilePage() {
  const user = await getUser('user-1');
  return (
    <div>
      <UserName userId="user-1" />  {/* 内部也调用 getUser('user-1') */}
      <UserAvatar userId="user-1" /> {/* 内部也调用 getUser('user-1') */}
      {/* 以上三次调用只执行一次数据库查询！ */}
    </div>
  );
}
```

### 去重范围

```
一个 HTTP 请求内的渲染树
├── layout.tsx       ← cache() 去重
├── page.tsx         ← cache() 去重
├── Component A      ← cache() / fetch 去重
├── Component B      ← cache() / fetch 去重
└── Component C      ← cache() / fetch 去重

不同 HTTP 请求之间 → 不去重（每个请求独立）
```

---

## 4.7 客户端数据获取

### 基础：`useEffect` + `fetch`

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading && <p>搜索中...</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### SWR — 客户端数据获取利器

```bash
npm install swr
```

```tsx
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PostsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/posts', fetcher, {
    refreshInterval: 30000,     // 每 30 秒后台刷新
    revalidateOnFocus: true,   // 回到页面时刷新
    dedupingInterval: 2000,    // 2 秒内不重复请求
  });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      <button onClick={() => mutate()}>刷新</button>
      {data.posts.map((post: any) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

### SWR vs 服务端 fetch

| 场景 | 推荐方案 |
|------|---------|
| 首屏数据 | 服务端 fetch / Server Components |
| 实时数据、轮询 | SWR |
| 搜索、筛选 | SWR 或 TanStack Query |
| 表单提交后的更新 | `mutate` + optimistic update |
| 需要 SEO 的数据 | 服务端 fetch |

---

## 4.8 乐观更新与 `useOptimistic`

乐观更新 = 先更新 UI，再确认服务端，提升交互体验。

```tsx
'use client';

import { useOptimistic, useState, useRef } from 'react';
import { sendMessage } from '@/app/actions';

type Message = { id: string; text: string; sending?: boolean };

export default function Chat({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const formRef = useRef<HTMLFormElement>(null);

  // useOptimistic: 当 addOptimisticMessage 被调用时，
  // 立即返回 [新消息 + 乐观消息, ...老消息]
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: Message) => [newMessage, ...state],
  );

  const formAction = async (formData: FormData) => {
    const text = formData.get('message') as string;
    formRef.current?.reset();

    const optimisticMessage = { id: crypto.randomUUID(), text, sending: true };

    // 1. 立即更新 UI（乐观更新）
    addOptimisticMessage(optimisticMessage);

    // 2. 发送到服务端
    const realMessage = await sendMessage(text);

    // 3. 替换乐观消息为真实消息
    setMessages(prev =>
      prev.map(m => (m.id === optimisticMessage.id ? realMessage : m)),
    );
  };

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex gap-2">
        <input name="message" className="flex-1 border p-2" required />
        <button type="submit" className="rounded bg-blue-500 px-4 py-2 text-white">
          发送
        </button>
      </form>
      {optimisticMessages.map(m => (
        <div key={m.id} className={m.sending ? 'opacity-50' : ''}>
          {m.text} {m.sending && '(发送中...)'}
        </div>
      ))}
    </div>
  );
}
```

---

## 本章最佳实践总结

1. **默认在服务端获取数据** — 更快、更安全、更好的 SEO
2. **把数据获取放到使用它的最小组件中** — 利用组件级流式加载
3. **使用 `React.cache()` 包装数据库查询** — 避免同一请求内重复查询
4. **给 fetch 打 `tags`** — 便于后续精确的缓存控制
5. **客户端用 SWR/TanStack Query** — 处理实时、轮询、搜索场景
6. **乐观更新** — 让用户感觉应用"秒响应"

---

:::demo optimistic
:::

## 练习

1. 创建一个页面，在 Server Component 中获取 GitHub API 数据
2. 用 `React.cache()` 包装一个数据库查询函数，验证去重效果
3. 给一个 fetch 请求打 `tags`，然后用 `revalidateTag` 触发缓存失效
4. 用 SWR 实现一个实时搜索功能
5. 实现一个添加评论的乐观更新效果
