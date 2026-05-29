# 第五章：服务端操作 — Server Actions 与 API 路由

---

## 5.1 Server Actions 基础

Server Actions 让你可以在 React 组件中直接调用服务端函数，无需手动创建 API 路由。

### 两种定义方式

**方式一：模块级 `'use server'`**

```ts
// src/app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // 直接在服务端执行
  const post = await db.post.create({
    data: { title, content },
  });

  revalidatePath('/posts');
  return post;
}
```

**方式二：内联 `'use server'`**

```tsx
// src/app/posts/new/page.tsx
export default function NewPostPage() {
  async function createPost(formData: FormData) {
    'use server';
    // 直接在组件内部写服务端逻辑
    await db.post.create({ ... });
  }

  return <form action={createPost}>...</form>;
}
```

> **安全原则：** Server Actions 是公开的 API 端点。永远不要信任输入数据。

---

## 5.2 表单处理

### 基础表单

```tsx
// src/app/posts/new/page.tsx
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  return (
    <form action={createPost} className="space-y-4">
      <div>
        <label htmlFor="title">标题</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full border p-2"
        />
      </div>
      <div>
        <label htmlFor="content">内容</label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          className="w-full border p-2"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        发布
      </button>
    </form>
  );
}
```

### `useFormStatus` — 提交状态

```tsx
// src/app/posts/new/submit-button.tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? '发布中...' : '发布'}
    </button>
  );
}
```

```tsx
// 在表单中使用
import { SubmitButton } from './submit-button';
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  return (
    <form action={createPost}>
      {/* ... 表单字段 ... */}
      <SubmitButton />
    </form>
  );
}
```

> **注意：** `useFormStatus` 必须在 `form` 的**子组件**中调用，读取的是父级 `<form>` 的状态。

### `useActionState` — 带状态的表单

```tsx
'use client';

import { useActionState } from 'react';
import { createPost, type CreatePostState } from '@/app/actions';

const initialState: CreatePostState = {
  message: '',
  errors: {},
};

export default function NewPostForm() {
  const [state, formAction] = useActionState(createPost, initialState);

  return (
    <form action={formAction}>
      {state.message && (
        <p className={state.errors ? 'text-red-500' : 'text-green-500'}>
          {state.message}
        </p>
      )}

      <input name="title" />
      {state.errors?.title && (
        <p className="text-red-500">{state.errors.title}</p>
      )}

      <textarea name="content" />
      {state.errors?.content && (
        <p className="text-red-500">{state.errors.content}</p>
      )}

      <button type="submit">发布</button>
    </form>
  );
}
```

对应的 Server Action：

```ts
// src/app/actions.ts
'use server';

export type CreatePostState = {
  message: string;
  errors?: { title?: string; content?: string };
  post?: { id: string };
};

export async function createPost(
  prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // 校验
  const errors: CreatePostState['errors'] = {};
  if (!title || title.length < 3) errors.title = '标题至少 3 个字符';
  if (!content || content.length < 10) errors.content = '内容至少 10 个字符';

  if (Object.keys(errors).length > 0) {
    return { message: '请修正以下错误', errors };
  }

  const post = await db.post.create({ data: { title, content } });
  revalidatePath('/posts');
  return { message: '发布成功！', post };
}
```

---

## 5.3 数据校验：Zod

```bash
npm install zod
```

```ts
// src/lib/validations.ts
import { z } from 'zod';

export const PostSchema = z.object({
  title: z
    .string()
    .min(3, '标题至少 3 个字符')
    .max(100, '标题最多 100 个字符'),
  content: z
    .string()
    .min(10, '内容至少 10 个字符'),
  published: z.boolean().optional(),
});

export type PostInput = z.infer<typeof PostSchema>;
```

```ts
// src/app/actions.ts
'use server';

import { PostSchema } from '@/lib/validations';

export async function createPost(formData: FormData) {
  // Zod 安全解析
  const result = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!result.success) {
    // 将 Zod 错误格式化为友好的 key-value
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      errors: fieldErrors,
      message: '数据校验失败',
    };
  }

  // result.data 已经是类型安全的了
  const post = await db.post.create({ data: result.data });
  revalidatePath('/posts');
  return { post, message: '创建成功' };
}
```

### 服务端数据校验优先级

```
1. Zod Schema（类型安全 + 业务规则）
2. 数据库约束（unique、not null 等）
3. 前端 HTML 校验（required、pattern 等 — 仅提升 UX，不保证安全）
```

---

## 5.4 非表单场景下的 Server Actions

### 按钮点击

```tsx
'use client';

import { deletePost } from '@/app/actions';
import { useState } from 'react';

export function DeleteButton({ postId }: { postId: string }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    await deletePost(postId);
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-red-500">
        删除
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={handleDelete} className="text-red-700 font-bold">
        确认删除
      </button>
      <button onClick={() => setConfirming(false)}>取消</button>
    </div>
  );
}
```

```ts
// src/app/actions.ts
'use server';

export async function deletePost(postId: string) {
  // 权限检查
  const session = await getSession();
  if (!session) throw new Error('未登录');

  const post = await db.post.findUnique({ where: { id: postId } });
  if (post?.authorId !== session.user.id) throw new Error('无权删除');

  await db.post.delete({ where: { id: postId } });
  revalidatePath('/posts');
}
```

### 在 `useEffect` 中调用

```tsx
'use client';

import { useEffect } from 'react';
import { trackPageView } from '@/app/actions';

export function PageViewTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    // useEffect 中可以直接调用 Server Actions
    trackPageView(pageId);
  }, [pageId]);

  return null;
}
```

### 使用 `useTransition` 获取 pending 状态

```tsx
'use client';

import { useTransition } from 'react';
import { addToCart } from '@/app/actions';

export function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => addToCart(productId))}
      disabled={isPending}
    >
      {isPending ? '添加中...' : '加入购物车'}
    </button>
  );
}
```

---

## 5.5 Route Handlers — 构建 REST API

即使有 Server Actions，Route Handlers 在以下场景仍然重要：
- 外部系统需要调用你的 API
- Mobile App 需要后端接口
- Webhook 接收
- 需要精确控制 HTTP 缓存头

### 基础 CRUD

```ts
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const posts = await db.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await db.post.count();

  return NextResponse.json({
    data: posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = PostSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 },
    );
  }

  const post = await db.post.create({ data: result.data });
  return NextResponse.json(post, { status: 201 });
}
```

### 设置自定义响应头

```ts
export async function GET() {
  const data = await fetchSomething();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Custom-Header': 'hello',
    },
  });
}
```

### CORS 处理

```ts
// src/app/api/public/route.ts
export async function GET() {
  return NextResponse.json(
    { message: 'public data' },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## 5.6 文件上传

```tsx
// src/app/upload/page.tsx
'use client';

import { uploadFile } from '@/app/actions';
import { useState } from 'react';

export default function UploadPage() {
  const [url, setUrl] = useState('');

  return (
    <form
      action={async (formData) => {
        const result = await uploadFile(formData);
        if (result.url) setUrl(result.url);
      }}
    >
      <input type="file" name="file" accept="image/*" />
      <button type="submit">上传</button>
      {url && <img src={url} alt="上传的图片" className="mt-4 max-w-md" />}
    </form>
  );
}
```

```ts
// src/app/actions.ts
'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) return { error: '请选择文件' };
  if (file.size > 5 * 1024 * 1024) return { error: '文件大小不能超过 5MB' };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split('.').pop();
  const filename = `${randomUUID()}.${ext}`;
  const path = join(process.cwd(), 'public/uploads', filename);

  await writeFile(path, buffer);

  return { url: `/uploads/${filename}` };
}
```

---

## 5.7 Webhook 集成

### 接收 Stripe Webhook

```ts
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook 签名验证失败` },
      { status: 400 },
    );
  }

  // 处理不同事件类型
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // 更新订单状态
      await db.order.update({
        where: { stripeSessionId: session.id },
        data: { status: 'paid' },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      // 处理订阅取消
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

> **注意：** Webhook 路由通常需要禁用 body 解析（Pages Router 方式），但在 App Router 中使用 `request.text()` 已经是原始 body。

---

## Server Actions vs Route Handlers

| 特性 | Server Actions | Route Handlers |
|------|---------------|----------------|
| 定义方式 | `'use server'` 函数 | `route.ts` 导出的 HTTP 方法 |
| 调用方式 | 直接函数调用（表单 action / 事件处理） | HTTP 请求 |
| 类型安全 | 天然类型安全 | 需要手动序列化/反序列化 |
| CSRF 保护 | 自动包含 | 需要自行处理 |
| 外部调用 | 不支持 | 支持（公开 API） |
| 适用场景 | 表单提交、数据变更 | REST API、Webhooks、第三方集成 |

## Server Actions 安全实践

> **Reactor2Shell 漏洞 (CVE-2025-55182)：** React 19.2.4+ / Next.js 16.0.11+ 修复了 RSC Flight 序列化相关的严重 RCE 漏洞（CVSS 9.8）。务必使用最新版本。

### 关键安全规则

```ts
'use server';

import { auth } from '@/auth';
import { z } from 'zod';

// ✅ 规则 1：永远用 Zod 校验所有输入
const DeletePostSchema = z.object({
  postId: z.string().cuid(),  // 精确的类型校验，不只是 string
});

export async function deletePost(formData: FormData) {
  // ✅ 规则 2：先认证，再授权
  const session = await auth();
  if (!session?.user) throw new Error('未登录');

  const { postId } = DeletePostSchema.parse({
    postId: formData.get('postId'),
  });

  // ✅ 规则 3：验证数据所有权（不能信任客户端传的任意 ID）
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== session.user.id) {
    throw new Error('无权操作');
  }

  // ✅ 规则 4：不要从 Server Action 返回敏感数据
  // ❌ return { secretKey: process.env.STRIPE_KEY }  // 危险！
  // ✅ return { success: true }                       // 安全

  await db.post.delete({ where: { id: postId } });
  return { success: true };
}
```

### Server Actions 安全检查清单

```
✅ 始终用 Zod 校验输入（不信任 FormData 和客户端参数）
✅ 始终验证用户身份和权限（auth + 所有权检查）
✅ 服务端重新计算价格/折扣（不信任客户端传来的金额）
✅ 使用 rate limiting（防止暴力调用）
✅ 不要返回堆栈详情给客户端（生产环境）
✅ 敏感操作（支付、删除）需要二次确认
✅ RSC 暴露的公共端点做好速率限制
✅ 保持 React / Next.js 版本更新（关注安全公告）
```

---

:::demo zod-validation
:::

## 练习

1. 用 Server Action 实现一个带 Zod 校验的注册表单
2. 使用 `useFormStatus` 和 `useActionState` 给表单添加提交状态和错误提示
3. 创建一个 RESTful API（GET/POST/PUT/DELETE），实现文章 CRUD
4. 实现一个图片上传功能，限制文件大小和类型
5. 编写一个 Webhook 接收接口，验证签名后处理事件
