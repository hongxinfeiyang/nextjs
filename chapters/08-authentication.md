# 第八章：认证与中间件

---

## 8.1 认证策略概览

在 Next.js 中，认证发生在多个层面：

```
客户端（浏览器）              服务端（Next.js）             数据库
    │                              │                        │
    │  ──── 登录请求 ──────────────→│                        │
    │                              │── 验证凭据 ───────────→│
    │                              │←─ 用户数据 ────────────│
    │                              │                        │
    │                              │── 创建 Session/JWT ──   │
    │←─── Set-Cookie ─────────────│                        │
    │                              │                        │
    │  ──── 后续请求（Cookie）─────→│                        │
    │                              │── 解析 Cookie           │
    │                              │── 查找用户 / 验证 JWT    │
    │                              │── 注入用户数据到请求      │
```

| 方案 | 原理 | 优势 | 劣势 |
|------|------|------|------|
| JWT | 自包含令牌，客户端存储 | 无状态、可扩展 | 无法主动失效 |
| Session | 服务端存储，Cookie 传递 sessionId | 可主动失效 | 需要 session 存储 |
| OAuth | 第三方授权 | 免密码、安全 | 依赖第三方 |
| WebAuthn | 生物识别/硬件密钥 | 极高安全性 | 复杂度高 |

---

## 8.2 NextAuth.js (Auth.js) 集成

Auth.js v5 是 Next.js 生态最主流的认证库。

```bash
npm install next-auth@beta @auth/prisma-adapter
```

### 基础配置

```ts
// src/auth.ts — Auth.js 核心配置
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),

  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],

  callbacks: {
    // 在 JWT 中存储额外字段
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // 将 JWT 字段暴露到 session 中
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login?error=true',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.AUTH_SECRET,
});
```

### 设置 API 路由处理器

```ts
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

### 环境变量

```env
# .env.local
AUTH_SECRET="your-secret-key-generated-by: npx auth secret"

AUTH_GITHUB_ID="github-oauth-client-id"
AUTH_GITHUB_SECRET="github-oauth-client-secret"

AUTH_GOOGLE_ID="google-oauth-client-id"
AUTH_GOOGLE_SECRET="google-oauth-client-secret"
```

---

## 8.3 Proxy / Middleware 详解

> **Next.js 16 重要变更：`middleware.ts` 已废弃，改为 `proxy.ts`。** 导出函数也改为 `proxy()`。旧的 `middleware.ts` 仍然可用但会在未来版本中移除。

Next.js 的 Proxy 在所有请求到达页面/API 之前运行，是**路由保护**的最佳位置。Next.js 16 起 Proxy 默认在 **Node.js 运行时** 中执行（不再是 Edge Runtime）。

### 基础 Proxy

```ts
// src/proxy.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 保护路由列表
  const protectedPaths = ['/dashboard', '/profile', '/settings'];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录用户访问登录页 → 重定向到首页
  if (req.auth && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

// matcher 配置保持不变
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/login'],
};
```

> **迁移提示：** 只需将文件从 `middleware.ts` 重命名为 `proxy.ts`，导出函数从 `middleware` 改为 `proxy`，其余代码保持不变。

### 高级 Proxy 模式

```ts
// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

// 速率限制（生产环境建议用 Redis）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { blocked: false };
  }
  if (record.count >= limit) {
    return { blocked: true };
  }
  record.count++;
  return { blocked: false };
}

export default auth((req) => {
  const ip = req.ip ?? 'unknown';

  // 对 API 路由进行速率限制
  if (req.nextUrl.pathname.startsWith('/api/ai')) {
    const { blocked } = rateLimit(ip, 5, 60000);
    if (blocked) {
      return NextResponse.json(
        { error: '请求过于频繁' },
        { status: 429 },
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/api/ai/:path*'],
};
```

### Proxy 的执行位置

```
请求 → Proxy (Node.js 运行时，默认) → 路由匹配 → Layout → Page
         │
         └─ 可以读取/设置 Cookie、重定向、重写 URL、添加请求头
         └─ Next.js 16：运行在 Node.js 运行时（不再是 Edge）
         └─ 有完全的文件系统、数据库等 Node.js API 访问能力
```

---

## 8.4 凭证登录

### 注册 API

```ts
// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  // 校验
  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: '邮箱不能为空，密码至少 8 位' },
      { status: 400 },
    );
  }

  // 检查重复
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: '该邮箱已注册' },
      { status: 409 },
    );
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 12);

  // 创建用户
  const user = await db.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user, { status: 201 });
}
```

### 登录表单（结合 Auth.js Credentials）

```tsx
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError('邮箱或密码错误');
      setLoading(false);
    } else {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
      router.refresh(); // 刷新服务端数据
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">登录</h1>

        {error && (
          <div className="rounded bg-red-50 p-3 text-red-600">{error}</div>
        )}

        <div>
          <label htmlFor="email">邮箱</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="password">密码</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-500 py-2 text-white disabled:opacity-50"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
}
```

### 在服务端获取当前用户

```tsx
// src/app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div>
      <h1>欢迎，{session.user.name}</h1>
      <p>邮箱：{session.user.email}</p>
    </div>
  );
}
```

---

## 8.5 OAuth 社交登录

OAuth 登录比凭证登录更简单，Auth.js 帮你处理了大部分流程：

```tsx
// src/app/login/page.tsx — 社交登录按钮
import { signIn } from '@/auth';

export function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-2">
      <form
        action={async () => {
          'use server';
          await signIn('github', { redirectTo: '/dashboard' });
        }}
      >
        <button type="submit" className="w-full rounded border py-2 hover:bg-gray-50">
          GitHub 登录
        </button>
      </form>

      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/dashboard' });
        }}
      >
        <button type="submit" className="w-full rounded border py-2 hover:bg-gray-50">
          Google 登录
        </button>
      </form>
    </div>
  );
}
```

> **OAuth 流程简述：** 用户点击登录 → 重定向到 GitHub/Google → 用户授权 → 回调 `/api/auth/callback/github` → Auth.js 创建/关联用户 → 设置 session cookie → 重定向回应用

---

## 8.6 角色与权限控制 (RBAC)

### 在 Server Action 中检查权限

```ts
// src/app/actions.ts
'use server';

import { auth } from '@/auth';

export async function deleteUser(userId: string) {
  const session = await auth();

  // 权限检查
  if (!session?.user) {
    throw new Error('未登录');
  }

  if (session.user.role !== 'admin') {
    throw new Error('无权执行此操作');
  }

  // 不允许删除自己
  if (session.user.id === userId) {
    throw new Error('不能删除自己');
  }

  await db.user.delete({ where: { id: userId } });
  revalidatePath('/admin/users');
}
```

### 权限中间件

```tsx
// src/components/auth/role-guard.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

type Role = 'user' | 'moderator' | 'admin';

const roleHierarchy: Record<Role, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

export async function requireRole(minRole: Role) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userLevel = roleHierarchy[session.user.role as Role] ?? 0;
  const requiredLevel = roleHierarchy[minRole];

  if (userLevel < requiredLevel) {
    redirect('/unauthorized');
  }

  return session;
}
```

```tsx
// 在页面中使用
// src/app/admin/page.tsx
import { requireRole } from '@/components/auth/role-guard';

export default async function AdminPage() {
  await requireRole('admin');
  // 通过权限检查，继续渲染
  return <div>管理后台</div>;
}
```

---

## 8.7 安全的 Cookie 与会话管理

### 关键安全实践

```ts
// src/auth.ts
export const { auth } = NextAuth({
  // ...

  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',  // __Secure- 前缀
      options: {
        httpOnly: true,    // JS 无法读取
        sameSite: 'lax',   // 防止 CSRF
        secure: process.env.NODE_ENV === 'production', // HTTPS only
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 天
      },
    },
  },

  // JWT 配置
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 天
  },

  // 其它安全选项
  trustHost: true,        // 信任反向代理的 host
});
```

### 安全清单

```
✅ Cookie 设置 httpOnly: true
✅ Cookie 设置 secure: true（生产环境）
✅ Cookie 设置 sameSite: 'lax' 或 'strict'
✅ 密码使用 bcrypt/argon2 哈希（cost ≥ 12）
✅ JWT secret 足够长（≥ 32 字符）
✅ 使用 HTTPS
✅ 实现 CSRF 保护（Server Actions 自动包含）
✅ 登录失败不暴露具体原因（"邮箱或密码错误" 而非 "用户不存在"）
✅ 实现速率限制（防止暴力破解）
✅ 敏感操作（删除、支付）要求二次确认
```

## 练习

1. 配置 Auth.js，支持凭证登录和 GitHub OAuth 登录
2. 创建 Middleware 保护 `/dashboard` 和 `/admin` 路由
3. 实现用户注册页面，包含密码强度校验
4. 为应用添加基于角色的权限控制（user / admin）
5. 实现"记住我"功能和会话过期处理
