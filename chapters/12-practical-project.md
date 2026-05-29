# 第十二章：实战项目 — 全栈电商平台

本章将所有知识整合，从零构建一个完整的在线商城。项目覆盖用户系统、商品管理、购物车、订单、支付和管理后台。

---

## 12.1 项目架构设计

### 功能范围

```
用户端（前台）                   管理端（后台）
─────────────                   ─────────────
- 商品浏览/搜索/筛选              - 商品 CRUD
- 商品详情                       - 订单管理
- 购物车                         - 用户管理
- 下单流程                       - 数据统计
- 订单查看
- 用户注册/登录
```

### 目录结构

```
src/
├── app/
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                   # 首页
│   ├── globals.css
│   │
│   ├── (store)/                   # 前台路由组
│   │   ├── layout.tsx             # 前台公共布局（导航、页脚）
│   │   ├── page.tsx               # 首页
│   │   ├── products/
│   │   │   ├── page.tsx           # 商品列表
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # 商品详情
│   │   ├── cart/
│   │   │   └── page.tsx           # 购物车
│   │   ├── checkout/
│   │   │   └── page.tsx           # 结算
│   │   └── orders/
│   │       ├── page.tsx           # 订单列表
│   │       └── [id]/
│   │           └── page.tsx       # 订单详情
│   │
│   ├── (auth)/                    # 认证路由组
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (admin)/                   # 后台路由组
│   │   ├── layout.tsx             # 后台布局（侧边栏）
│   │   ├── admin/
│   │   │   └── page.tsx           # 后台首页（仪表盘）
│   │   ├── admin/products/
│   │   │   ├── page.tsx           # 商品管理
│   │   │   └── new/
│   │   │       └── page.tsx       # 新增商品
│   │   └── admin/orders/
│   │       └── page.tsx           # 订单管理
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── products/route.ts
│       └── checkout/route.ts
│
├── components/
│   ├── ui/                        # 基础 UI 组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── modal.tsx
│   ├── store/                     # 前台专属组件
│   │   ├── product-card.tsx
│   │   ├── cart-drawer.tsx
│   │   └── search-input.tsx
│   └── admin/                     # 后台专属组件
│       ├── sidebar.tsx
│       └── stats-card.tsx
│
├── lib/
│   ├── db.ts                      # Prisma Client
│   ├── utils.ts                   # 工具函数 (cn, slugify)
│   ├── validations.ts             # Zod Schema
│   └── constants.ts               # 常量
│
├── stores/
│   └── cart-store.ts              # Zustand 购物车
│
└── auth.ts                        # Auth.js 配置
```

### 技术选型

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript (strict) |
| 样式 | Tailwind CSS + `cn` + `cva` |
| 数据库 | PostgreSQL + Prisma |
| 认证 | Auth.js v5 (JWT strategy) |
| 客户端状态 | Zustand |
| 校验 | Zod |
| 支付（模拟） | Stripe API |
| 部署 | Vercel |
| 测试 | Vitest + Playwright |

---

### 用户数据库模型

```prisma
// prisma/schema.prisma
model User {
  id        String     @id @default(cuid())
  name      String
  email     String     @unique
  password  String?    // OAuth 用户可能没有密码
  image     String?
  role      Role       @default(USER)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  orders    Order[]
  reviews   Review[]
  addresses Address[]
  accounts  Account[]
  sessions  Session[]

  @@map("users")
}

model Address {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label     String?  // "家", "公司"
  name      String
  phone     String
  province  String
  city      String
  district  String
  detail    String
  isDefault Boolean  @default(false) @map("is_default")
  createdAt DateTime @default(now())

  @@map("addresses")
}

enum Role {
  USER
  ADMIN
}
```

### 注册页面

```tsx
// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // 注册
    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
      return;
    }

    // 注册成功 → 自动登录
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    router.push('/');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="mb-6 text-2xl font-bold">注册</h1>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name">姓名</label>
          <input id="name" name="name" required className="w-full rounded border p-2" />
        </div>
        <div>
          <label htmlFor="email">邮箱</label>
          <input id="email" name="email" type="email" required className="w-full rounded border p-2" />
        </div>
        <div>
          <label htmlFor="password">密码</label>
          <input id="password" name="password" type="password" required minLength={8} className="w-full rounded border p-2" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-blue-500 py-2 text-white disabled:opacity-50">
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        已有账号？<a href="/login" className="text-blue-500">登录</a>
      </p>
    </div>
  );
}
```

### Auth.js 配置（完整版）

```ts
// src/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },

  providers: [
    Credentials({
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
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```

### Middleware（路由保护）

```ts
// src/middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 管理后台只允许 ADMIN 角色
  if (pathname.startsWith('/admin')) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL('/login?redirect=' + pathname, req.url));
    }
    if ((req.auth.user as any).role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 需要登录的页面
  const protectedPaths = ['/checkout', '/orders', '/profile'];
  if (protectedPaths.some(p => pathname.startsWith(p)) && !req.auth?.user) {
    return NextResponse.redirect(new URL('/login?redirect=' + pathname, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/checkout/:path*', '/orders/:path*', '/profile/:path*'],
};
```

---

### 商品数据库模型

```prisma
model Product {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String     @db.Text
  price       Decimal    @db.Decimal(10, 2)
  comparePrice Decimal?  @map("compare_price") @db.Decimal(10, 2)
  images      String[]   @default([])
  category    String
  stock       Int        @default(0)
  featured    Boolean    @default(false)
  published   Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  orderItems  OrderItem[]
  reviews     Review[]
  cartItems   CartItem[]

  @@index([category])
  @@index([published, createdAt])
  @@index([featured, published])
  @@map("products")
}
```

### 商品列表页

```tsx
// src/app/(store)/products/page.tsx
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { ProductGrid } from './_components/product-grid';
import { ProductFilters } from './_components/product-filters';
import { ProductGridSkeleton } from './_components/skeletons';
import { type SearchParams } from '@/lib/types';

export const metadata = { title: '全部商品' };

type Props = { searchParams: Promise<SearchParams> };

export default async function ProductsPage({ searchParams }: Props) {
  const { q, category, sort, page = '1', minPrice, maxPrice } = await searchParams;

  // 构建查询条件
  const where: any = { published: true };
  if (q) where.name = { contains: q };
  if (category) where.category = category;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  // 排序
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'name') orderBy = { name: 'asc' };

  const currentPage = Number(page);
  const pageSize = 12;

  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
    db.product.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { published: true },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">全部商品</h1>

      <div className="flex gap-8">
        {/* 侧边筛选栏 */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <ProductFilters
            categories={categories.map(c => c.category)}
            currentCategory={category}
            currentSort={sort}
            currentMinPrice={minPrice}
            currentMaxPrice={maxPrice}
          />
        </aside>

        {/* 商品网格 */}
        <main className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid
              products={products}
              page={currentPage}
              totalPages={totalPages}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

### 筛选组件（URL 状态管理）

```tsx
// src/app/(store)/products/_components/product-filters.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface FiltersProps {
  categories: string[];
  currentCategory?: string;
  currentSort?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
}

export function ProductFilters({
  categories,
  currentCategory,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
}: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // 重置页码
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* 搜索 */}
      <div>
        <h3 className="mb-2 font-semibold">搜索</h3>
        <input
          type="text"
          placeholder="搜索商品..."
          defaultValue={searchParams.get('q') || ''}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              updateFilter('q', (e.target as HTMLInputElement).value);
            }
          }}
          className="w-full rounded border p-2"
        />
      </div>

      {/* 分类 */}
      <div>
        <h3 className="mb-2 font-semibold">分类</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('category', '')}
            className={`block w-full text-left ${!currentCategory ? 'font-bold text-blue-500' : ''}`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => updateFilter('category', cat)}
              className={`block w-full text-left ${currentCategory === cat ? 'font-bold text-blue-500' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 排序 */}
      <div>
        <h3 className="mb-2 font-semibold">排序</h3>
        <select
          value={currentSort || ''}
          onChange={e => updateFilter('sort', e.target.value)}
          className="w-full rounded border p-2"
        >
          <option value="">最新</option>
          <option value="price_asc">价格从低到高</option>
          <option value="price_desc">价格从高到低</option>
        </select>
      </div>

      {/* 价格区间 */}
      <div>
        <h3 className="mb-2 font-semibold">价格区间</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="最低"
            defaultValue={currentMinPrice}
            onBlur={e => updateFilter('minPrice', e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            type="number"
            placeholder="最高"
            defaultValue={currentMaxPrice}
            onBlur={e => updateFilter('maxPrice', e.target.value)}
            className="w-full rounded border p-2"
          />
        </div>
      </div>
    </div>
  );
}
```

### 商品详情页

```tsx
// src/app/(store)/products/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Image from 'next/image';
import { AddToCartForm } from './add-to-cart-form';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });
  if (!product) return { title: '商品不存在' };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images },
  };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return products.map(p => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product || !product.published) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 图片画廊 */}
        <div className="space-y-4">
          {product.images.map((image, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={image}
                alt={`${product.name} - 图片 ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* 商品信息 */}
        <div className="sticky top-24 space-y-6">
          <div>
            <p className="text-sm text-gray-500">{product.category}</p>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-500">
              ¥{Number(product.price).toFixed(2)}
            </span>
            {product.comparePrice && (
              <span className="text-lg text-gray-400 line-through">
                ¥{Number(product.comparePrice).toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-gray-600">{product.description}</p>

          <div className="text-sm text-gray-500">
            {product.stock > 0 ? (
              <span className="text-green-600">有货（{product.stock}件）</span>
            ) : (
              <span className="text-red-500">暂时缺货</span>
            )}
          </div>

          <AddToCartForm productId={product.id} stock={product.stock} />

          {/* 评价 */}
          {product.reviews.length > 0 && (
            <div>
              <h3 className="font-semibold">用户评价（{product._count.reviews}）</h3>
              <div className="mt-2 space-y-3">
                {product.reviews.map(review => (
                  <div key={review.id} className="border-b pb-2">
                    <p className="font-medium">{review.user.name}</p>
                    <p className="text-yellow-500">{'★'.repeat(review.rating)}</p>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 12.4 购物车与订单

### Zustand 购物车 Store

```ts
// src/stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(i => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity > 0
            ? state.items.map(i =>
                i.productId === productId ? { ...i, quantity } : i,
              )
            : state.items.filter(i => i.productId !== productId),
        })),

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage' },
  ),
);
```

### 购物车页面

```tsx
// src/app/(store)/cart/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">购物车是空的</h1>
        <Link href="/products" className="mt-4 inline-block text-blue-500">
          去逛逛
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">购物车</h1>

      <div className="space-y-4">
        {items.map(item => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <Image
              src={item.image}
              alt={item.name}
              width={80}
              height={80}
              className="rounded"
            />

            <div className="flex-1">
              <Link
                href={`/products/${item.productId}`}
                className="font-semibold hover:text-blue-500"
              >
                {item.name}
              </Link>
              <p className="text-red-500">¥{item.price.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="rounded border px-2 py-1"
              >
                -
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="rounded border px-2 py-1"
              >
                +
              </button>
            </div>

            <p className="w-24 text-right font-semibold">
              ¥{(item.price * item.quantity).toFixed(2)}
            </p>

            <button
              onClick={() => removeItem(item.productId)}
              className="text-red-500 hover:text-red-700"
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border p-4">
        <div className="flex justify-between text-xl font-bold">
          <span>合计</span>
          <span>¥{subtotal().toFixed(2)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 block rounded bg-blue-500 py-3 text-center text-white"
        >
          去结算
        </Link>
      </div>
    </div>
  );
}
```

### 订单创建 Server Action

```ts
// src/app/actions/orders.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CartItem } from '@/stores/cart-store';

const CheckoutSchema = z.object({
  addressId: z.string().min(1, '请选择地址'),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export async function createOrder(items: CartItem[], addressId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('请先登录');

  const validated = CheckoutSchema.parse({ addressId, items });

  // 在事务中创建订单
  const order = await db.$transaction(async (tx) => {
    // 1. 验证每个商品库存和价格
    for (const item of validated.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.published) {
        throw new Error(`商品 "${item.name}" 不存在`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`商品 "${product.name}" 库存不足`);
      }
    }

    // 2. 计算总价（以数据库价格为准，防止客户端篡改价格）
    let total = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of validated.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      total += Number(product!.price) * item.quantity;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(product!.price),
      });

      // 3. 扣减库存
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 4. 创建订单
    return tx.order.create({
      data: {
        userId: session.user.id!,
        total,
        status: 'PENDING',
        addressId: validated.addressId,
        items: { createMany: { data: orderItems } },
      },
    });
  });

  revalidatePath('/orders');
  return order;
}
```

---

## 12.5 支付集成

### Stripe 支付流程

```ts
// src/app/actions/payment.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(orderId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('请先登录');

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.userId !== session.user.id) {
    throw new Error('订单不存在');
  }

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'alipay'],
    line_items: order.items.map(item => ({
      price_data: {
        currency: 'cny',
        product_data: { name: `商品 #${item.productId}` },
        unit_amount: Math.round(Number(item.price) * 100), // 分为单位
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=true`,
    metadata: { orderId: order.id },
  });

  // 保存 Stripe Session ID
  await db.order.update({
    where: { id: orderId },
    data: { stripeSessionId: stripeSession.id },
  });

  return { url: stripeSession.url };
}
```

### Webhook 处理

```ts
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await db.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## 12.6 后台管理系统

### 后台布局

```tsx
// src/app/(admin)/admin/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}
```

### 后台仪表盘

```tsx
// src/app/(admin)/admin/page.tsx
import { db } from '@/lib/db';
import { StatsCard } from '@/components/admin/stats-card';

export default async function AdminDashboard() {
  const [totalRevenue, totalOrders, totalUsers, totalProducts] =
    await Promise.all([
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      }),
      db.order.count(),
      db.user.count(),
      db.product.count(),
    ]);

  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">管理后台</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="总营收"
          value={`¥${(totalRevenue._sum.total || 0).toLocaleString()}`}
        />
        <StatsCard title="总订单" value={totalOrders.toString()} />
        <StatsCard title="用户数" value={totalUsers.toString()} />
        <StatsCard title="商品数" value={totalProducts.toString()} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">最近订单</h2>
        <table className="w-full rounded-lg bg-white shadow">
          <thead className="border-b text-left text-sm text-gray-500">
            <tr>
              <th className="p-3">订单 ID</th>
              <th className="p-3">用户</th>
              <th className="p-3">金额</th>
              <th className="p-3">状态</th>
              <th className="p-3">时间</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id} className="border-b">
                <td className="p-3 font-mono text-sm">#{order.id.slice(-8)}</td>
                <td className="p-3">{order.user.name}</td>
                <td className="p-3">¥{Number(order.total).toFixed(2)}</td>
                <td className="p-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {order.createdAt.toLocaleDateString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 12.7 性能优化与部署上线

### 项目性能优化清单

```tsx
// 1. 首屏优化 — 关键图片使用 priority
<Image src="/hero.jpg" alt="Hero" fill priority sizes="100vw" />

// 2. 静态页面导出
export const revalidate = 3600; // 商品列表每小时重新验证

// 3. 动态导入大组件
const ProductEditor = dynamic(
  () => import('@/components/admin/product-editor'),
  { ssr: false },
);

// 4. 路由预取
<Link href="/products/phone-case" prefetch={true}>查看</Link>

// 5. ISR + On-demand Revalidation
export async function updateProduct(id: string, data: any) {
  'use server';
  await db.product.update({ where: { id }, data });
  revalidatePath(`/products`);
  revalidatePath(`/products/${slug}`);
}
```

### `.env.local` 环境变量

```env
# 数据库
DATABASE_URL="postgresql://user:pass@localhost:5432/mystore"

# Auth.js
AUTH_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# 应用
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 部署到 Vercel

```bash
# 1. 推送代码到 GitHub

# 2. 在 Vercel 中导入项目

# 3. 设置环境变量
# Vercel Dashboard → Settings → Environment Variables

# 4. 自动部署（每次 push 触发）
git push origin main
```

---

## 项目总结

完成这个实战项目后，你已经实践了：

| 知识点 | 在项目中的体现 |
|--------|--------------|
| App Router | 文件路由结构、路由组 `(store)` `(admin)` `(auth)` |
| 动态路由 | `/products/[slug]` `/orders/[id]` |
| Layout 嵌套 | 前台布局 vs 后台布局 |
| SSR/SSG/ISR | 商品列表 ISR、静态生成详情页 |
| Server Components | 所有数据获取组件 |
| Client Components | `'use client'` 交互组件 |
| Server Actions | 商品创建、订单创建、支付 |
| Middleware | 路由保护、角色检查 |
| URL 状态管理 | 商品筛选参数 |
| Zustand | 购物车状态 + localStorage 持久化 |
| Auth.js | 凭证登录、JWT、回调 |
| Prisma | Schema 设计、关系、事务、迁移 |
| Zod | 表单校验、API 校验 |
| Tailwind CSS | 全站样式、响应式 |
| Stripe 集成 | 支付流程、Webhook |
| 安全实践 | 服务端价格验证、CSRF 保护、权限检查 |

---

## 练习

1. 实现商品评价的增删功能（需登录用户）
2. 为后台添加数据导出（CSV/Excel）功能
3. 实现优惠券/折扣码系统
4. 添加商品收藏/心愿单功能
5. 实现管理后台的图表统计（用 Chart.js 或 Recharts）
6. 为整个应用编写 Playwright E2E 测试
