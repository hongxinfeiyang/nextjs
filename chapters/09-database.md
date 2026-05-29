# 第九章：数据库集成与 ORM

---

## 9.1 数据库选型

### Next.js 生态中的主流数据库

| 数据库 | 类型 | 优势 | 适用场景 |
|--------|------|------|---------|
| PostgreSQL | 关系型 | 功能最全、生态最强 | 大多数应用首选 |
| MySQL | 关系型 | 广泛使用、运维成熟 | 传统应用迁移 |
| SQLite | 嵌入式 | 零配置、无需服务器 | 原型、单机应用 |
| PlanetScale | Serverless MySQL | 自动缩放、分支工作流 | Serverless 部署 |
| Neon | Serverless PG | 冷启动快、分支 | 边缘计算 |
| MongoDB | 文档型 | 灵活 Schema | 非结构化数据 |

### 推荐搭配

```
生产应用：PostgreSQL + Prisma + Supabase/Neon
原型/MVP：SQLite + Prisma
简单应用：Turso (libsql) + Drizzle
```

---

## 9.2 Prisma 入门

### 安装与设置

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

### Schema 定义

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// 模型定义
// ============================================================

model User {
  id        String     @id @default(cuid())
  name      String?
  email     String     @unique
  emailVerified DateTime?
  password  String?
  image     String?
  role      Role       @default(USER)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  posts     Post[]
  orders    Order[]
  accounts  Account[]
  sessions  Session[]

  @@map("users")
}

model Post {
  id        String     @id @default(cuid())
  title     String
  slug      String     @unique
  content   String     @db.Text
  published Boolean    @default(false)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  authorId  String     @map("author_id")
  author    User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  tags      PostTag[]

  @@index([authorId])
  @@index([published, createdAt])
  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  postId    String   @map("post_id")
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String   @map("author_id")
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("comments")
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  posts PostTag[]

  @@map("tags")
}

model PostTag {
  postId String @map("post_id")
  tagId  String @map("tag_id")
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

model Order {
  id        String    @id @default(cuid())
  total     Decimal   @db.Decimal(10, 2)
  status    OrderStatus @default(PENDING)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  userId    String    @map("user_id")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     OrderItem[]

  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Decimal @db.Decimal(10, 2)

  orderId   String  @map("order_id")
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String  @map("product_id")

  @@map("order_items")
}

// 以下为 Auth.js 所需模型
model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// ============================================================
// 枚举
// ============================================================

enum Role {
  USER
  MODERATOR
  ADMIN
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### Prisma Client 封装

```ts
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 开发环境下避免热重载创建多个实例
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

### 数据迁移

```bash
# 创建迁移文件
npx prisma migrate dev --name init

# 应用到生产环境
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate

# 可视化查看数据
npx prisma studio

# 同步 schema 到数据库（不创建迁移文件）
npx prisma db push
```

---

## 9.3 数据关系建模

### 1:1 关系

```prisma
model User {
  id      String   @id @default(cuid())
  profile Profile?  // 可选 1:1
}

model Profile {
  id     String @id @default(cuid())
  bio    String @db.Text
  userId String @unique  // unique 确保了 1:1
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 1:N 关系

```prisma
model User {
  id    String  @id @default(cuid())
  posts Post[]  // 一个用户有多个 Post
}

model Post {
  id       String @id @default(cuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

```ts
// 查询示例：获取用户及其所有文章
const user = await db.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

### N:N 关系

```prisma
model Post {
  id   String    @id @default(cuid())
  tags PostTag[]
}

model Tag {
  id    String    @id @default(cuid())
  posts PostTag[]
}

model PostTag {
  postId String
  tagId  String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
}
```

---

## 9.4 查询优化

### N+1 问题与解决方案

```ts
// ❌ N+1 问题：1 次查询取 posts + N 次查询取每个 post 的 author
const posts = await db.post.findMany();
for (const post of posts) {
  const author = await db.user.findUnique({ where: { id: post.authorId } });
  // 处理...
}

// ✅ 使用 include 一次性获取关联数据
const posts = await db.post.findMany({
  include: {
    author: {
      select: { id: true, name: true, image: true },
    },
    _count: {
      select: { comments: true },
    },
  },
});
```

### 选择性字段

```ts
// ✅ 只选需要的字段，减少数据传输
const posts = await db.post.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    createdAt: true,
    author: {
      select: { name: true },
    },
  },
  where: { published: true },
});
```

### 分页

```ts
// 偏移分页（适合小数据集）
export async function getPosts(page = 1, limit = 10) {
  const [posts, total] = await Promise.all([
    db.post.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.post.count({ where: { published: true } }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// 游标分页（适合大数据集和实时数据）
export async function getPostsCursor(cursor?: string, limit = 10) {
  const posts = await db.post.findMany({
    take: limit + 1, // 多取一条判断是否有下一页
    where: { published: true },
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // 跳过 cursor 本身
    }),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;

  return {
    posts: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    hasMore,
  };
}
```

### 事务

```ts
// 批量操作保证原子性
const order = await db.$transaction(async (tx) => {
  // 1. 检查库存
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product || product.stock < quantity) {
    throw new Error('库存不足');
  }

  // 2. 扣减库存
  await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });

  // 3. 创建订单
  return tx.order.create({
    data: {
      userId,
      total: product.price * quantity,
      items: {
        create: { productId, quantity, price: product.price },
      },
    },
  });
});
```

---

## 9.5 Drizzle ORM 简介

Drizzle 是一个轻量级、类型安全的 TypeScript ORM，与 Prisma 的主要区别：

| 对比维度 | Prisma | Drizzle |
|---------|--------|---------|
| Schema 定义 | 自定义 DSL (.prisma 文件) | TypeScript 代码 |
| Bundle 大小 | ~300KB | ~50KB |
| SQL 控制力 | 高层抽象 | 接近原生 SQL |
| 边缘兼容 | 需要 Data Proxy | 开箱即用 |
| 迁移方式 | 声明式 (prisma migrate) | 命令式 (drizzle-kit) |

### Drizzle 示例

```typescript
// src/db/schema.ts
import { pgTable, text, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'moderator', 'admin']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique().notNull(),
  password: text('password'),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  content: text('content').notNull(),
  published: integer('published').default(0).notNull(),
  authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
```

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

```typescript
// 查询示例
const userPosts = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.published, 1),
      orderBy: desc(posts.createdAt),
    },
  },
});
```

---

## 9.6 Server Actions 中的数据库安全

```ts
// src/app/actions.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10),
  published: z.boolean().optional(),
});

export async function createPost(formData: FormData) {
  // 1. 认证
  const session = await auth();
  if (!session?.user) throw new Error('请先登录');

  // 2. 校验
  const { title, content, published } = CreatePostSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
    published: formData.get('published') === 'on',
  });

  // 3. 权限检查（防止设置别人的 authorId）
  const post = await db.post.create({
    data: {
      title,
      content,
      published,
      slug: slugify(title),
      authorId: session.user.id, // 从 session 获取，不信任客户端
    },
  });

  return post;
}
```

### 安全原则

```ts
// ❌ 危险：信任客户端传的 userId
await db.post.create({
  data: { title, authorId: formData.get('authorId') },
});

// ✅ 安全：从 session 获取 userId
await db.post.create({
  data: { title, authorId: session.user.id },
});

// ❌ 危险：直接把用户输入拼接进查询
await db.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ 安全：使用参数化查询
await db.user.findUnique({ where: { email } });
```

---

## 9.7 数据库迁移与种子数据

### 种子数据

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 创建管理员
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
    },
  });

  // 创建示例文章
  const posts = await Promise.all(
    Array.from({ length: 20 }).map((_, i) =>
      prisma.post.create({
        data: {
          title: `示例文章 #${i + 1}`,
          slug: `example-post-${i + 1}`,
          content: `这是第 ${i + 1} 篇示例文章的详细内容...`,
          published: i < 15, // 前 15 篇已发布
          authorId: admin.id,
        },
      }),
    ),
  );

  console.log(`创建了管理员和 ${posts.length} 篇文章`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```jsonc
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
npx prisma db seed
```

---

## 9.8 生产环境连接池与边缘兼容

### 连接池问题

Serverless 环境（Vercel、Lambda）下，每个请求可能触发新的数据库连接。如果没有连接池，连接数会迅速耗尽。

#### 方案一：Prisma Data Proxy（官方推荐）

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // 添加这一行，Prisma Client 通过 HTTP 代理连接数据库
  // 而非直接 TCP 连接
}

// 然后使用 prisma:// 协议的连接字符串
```

#### 方案二：pgBouncer / PgCat

```env
# 使用 pgBouncer 的连接池端口
DATABASE_URL="postgresql://user:pass@host:6432/db?pgbouncer=true"
```

#### 方案三：使用 @prisma/client/edge

```ts
// 边缘环境专用（如 Cloudflare Workers）
import { PrismaClient } from '@prisma/client/edge';
```

### 数据库连接最佳实践

1. **单例模式** — 一个进程只创建一个 Prisma Client 实例
2. **连接池** — 生产环境务必使用连接池（PgBouncer / Data Proxy / pgpool）
3. **预热连接** — Serverless 冷启动时预先连接
4. **合理超时** — 设置 `connection_limit` 和查询超时

---

## 练习

1. 用 Prisma 设计一个博客系统数据库（User、Post、Comment、Tag），编写 Schema 并执行迁移
2. 实现文章列表分页查询（偏移分页 + 游标分页）
3. 用 `$transaction` 实现一个库存扣减 + 创建订单的原子操作
4. 编写种子脚本，生成 50 条测试数据
5. 研究你的部署平台（Vercel / Docker）的连接池配置方案
