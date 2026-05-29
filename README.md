# Next.js 从 0 到精通 — 全栈学习路线

> 适用版本：Next.js 15+ (App Router)，React 19+
> 前置知识：HTML / CSS / JavaScript 基础，React 基础（了解 JSX、组件、hooks）
> 学习周期：建议 8-12 周，每章 3-7 天

---

## 学习路线图

```
第1章  → 第2章  → 第3章  → 第4章  → 第5章  → 第6章
基础     路由     渲染     数据获取  服务端    客户端
  │        │        │        │        │        │
  └────────┴────────┴────────┴────────┴────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
        第7章       第8章       第9章
        样式        认证       数据库
          │           │           │
          └───────────┼───────────┘
                      │
                 ┌────┴────┐
                 │         │
               第10章   第11章
               性能     测试
                 │         │
                 └────┬────┘
                      │
                    第12章
                  实战项目
                      │
                    第13章         第14章
              进阶补充主题    15→16 迁移指南
```

---

## [第一章：Next.js 基础 — 项目搭建与核心概念](/chapters/01-foundation.md)

**学习目标：** 理解 Next.js 是什么，搭建第一个项目，掌握目录结构

- 1.1 Next.js 简介与生态定位
- 1.2 环境准备与项目创建 (`create-next-app`)
- 1.3 目录结构详解 (app/、public/、next.config.ts)
- 1.4 开发服务器与构建流程 (`next dev` / `next build` / `next start`)
- 1.5 TypeScript 配置与严格模式
- 1.6 第一个页面：Hello World 到动态页面

## [第二章：路由系统 — App Router 详解](/chapters/02-routing.md)

**学习目标：** 精通文件系统路由，掌握 layouts、动态路由、路由组

- 2.1 文件即路由：`page.tsx` 与路由映射规则
- 2.2 布局系统：`layout.tsx` 与嵌套布局
- 2.3 动态路由：`[id]` / `[...slug]` / `[[...slug]]`
- 2.4 路由组与私有文件夹：`(group)` / `_components`
- 2.5 Loading UI 与 Streaming：`loading.tsx` / `Suspense`
- 2.6 错误处理：`error.tsx` / `global-error.tsx` / `not-found.tsx`
- 2.7 并行路由与拦截路由：`@modal` / `(.)photo`
- 2.8 路由处理器：`route.ts` (GET/POST/PUT/DELETE)

## [第三章：渲染策略 — SSR / SSG / ISR / CSR](/chapters/03-rendering.md)

**学习目标：** 理解四种渲染模式的区别、使用场景与底层原理

- 3.1 渲染模式全景图：静态 vs 动态 vs 流式
- 3.2 服务端渲染 (SSR)：`dynamic = 'force-dynamic'`
- 3.3 静态生成 (SSG)：`generateStaticParams`
- 3.4 增量静态再生 (ISR)：`revalidate` 时间策略
- 3.5 客户端渲染 (CSR)：`'use client'` 边界
- 3.6 部分预渲染 (PPR)：实验性特性
- 3.7 选择渲染策略的决策树

## [第四章：数据获取 — Server Components 与缓存策略](/chapters/04-data-fetching.md)

**学习目标：** 掌握在服务端和客户端获取数据的所有方式

- 4.1 Server Components 中的数据获取
- 4.2 扩展 `fetch` API：`cache` / `next.revalidate` / `tags`
- 4.3 缓存策略：Data Cache / Full Route Cache / Router Cache
- 4.4 按需验证缓存：`revalidateTag` / `revalidatePath`
- 4.5 并行数据请求与 `Promise.all`
- 4.6 React `cache()` 与请求去重 (Deduplication)
- 4.7 客户端数据获取：`useEffect` / SWR / TanStack Query
- 4.8 乐观更新 (Optimistic Updates) 与 `useOptimistic`

## [第五章：服务端操作 — Server Actions 与 API 路由](/chapters/05-server-actions.md)

**学习目标：** 学会处理表单、数据变更和构建 API

- 5.1 Server Actions 基础：`'use server'` 指令
- 5.2 表单处理：`action` 属性 / `useFormStatus` / `useFormState`
- 5.3 数据校验：Zod Schema 校验
- 5.4 非表单场景下的 Server Actions
- 5.5 Route Handlers：构建 REST API
- 5.6 文件上传处理
- 5.7 Webhooks 与外部 API 集成

## [第六章：状态管理与客户端交互](/chapters/06-state-management.md)

**学习目标：** 管理客户端状态，处理用户交互

- 6.1 `'use client'` 边界的深度理解
- 6.2 URL 作为状态源：`useSearchParams` / `useRouter`
- 6.3 Context API 与服务端数据的桥梁
- 6.4 全局状态管理：Zustand / Jotai
- 6.5 表单交互模式：受控 vs 非受控
- 6.6 动画与过渡：`startTransition` / Framer Motion
- 6.7 第三方客户端的集成模式

## [第七章：样式方案 — CSS Modules / Tailwind / CSS-in-JS](/chapters/07-styling.md)

**学习目标：** 掌握 Next.js 中的各种样式方案及最佳实践

- 7.1 全局样式与 CSS Modules
- 7.2 Tailwind CSS 集成与配置
- 7.3 CSS-in-JS 方案与 RSC 兼容性
- 7.4 条件样式与 `clsx` / `cn` 工具函数
- 7.5 响应式设计与暗色模式
- 7.6 字体优化：`next/font`
- 7.7 图片优化：`next/image`

## [第八章：认证与中间件](/chapters/08-authentication.md)

**学习目标：** 实现完整的用户认证与授权系统

- 8.1 认证策略概览：JWT vs Session vs OAuth
- 8.2 NextAuth.js (Auth.js) 集成
- 8.3 Middleware 详解：路由保护与重定向
- 8.4 凭证登录：邮箱/密码 + bcrypt
- 8.5 OAuth 社交登录：GitHub / Google
- 8.6 角色与权限控制 (RBAC)
- 8.7 安全的 Cookie 与会话管理

## [第九章：数据库集成与 ORM](/chapters/09-database.md)

**学习目标：** 在 Next.js 中集成数据库，掌握数据建模与迁移

- 9.1 数据库选型：PostgreSQL / MySQL / SQLite / PlanetScale
- 9.2 Prisma 入门：Schema、Client、Migrations
- 9.3 数据关系建模：1:1 / 1:N / N:N
- 9.4 查询优化：N+1 问题与 `include`/`select`
- 9.5 Drizzle ORM 简介与对比
- 9.6 Server Actions 中安全地进行数据库操作
- 9.7 数据库迁移与种子数据
- 9.8 生产环境连接池与边缘兼容性

## [第十章：性能优化与部署最佳实践](/chapters/10-performance.md)

**学习目标：** 测量、分析和优化 Next.js 应用性能

- 10.1 Core Web Vitals 与 Lighthouse
- 10.2 Bundle Analysis：`@next/bundle-analyzer`
- 10.3 代码分割策略：动态 `import()` / `lazy`
- 10.4 图片性能：`next/image` 最佳实践
- 10.5 字体加载策略与 CLS 优化
- 10.6 缓存策略调优
- 10.7 服务端性能：数据库查询 / 连接池 / 边缘计算
- 10.8 部署方案：Vercel / Docker / 自托管
- 10.9 CI/CD 流水线搭建

## [第十一章：测试策略 — 单元 / 集成 / E2E 测试](/chapters/11-testing.md)

**学习目标：** 建立完整的测试体系

- 11.1 测试金字塔与策略
- 11.2 Vitest + React Testing Library：组件测试
- 11.3 Server Components 测试
- 11.4 API Route / Server Actions 单元测试
- 11.5 E2E 测试：Playwright
- 11.6 数据库测试：测试环境隔离
- 11.7 快照测试与视觉回归测试
- 11.8 测试覆盖率与 CI 集成

## [第十二章：实战项目 — 全栈电商平台](/chapters/12-practical-project.md)

**学习目标：** 综合运用所有知识，构建完整项目

- 12.1 项目架构设计
- 12.2 用户系统：注册/登录/个人中心
- 12.3 商品管理：CRUD / 搜索 / 分页 / 筛选
- 12.4 购物车与订单系统
- 12.5 支付集成（Stripe 模拟）
- 12.6 后台管理系统
- 12.7 性能优化与部署上线

## [第十三章：补充主题 — 进阶知识全景](/chapters/13-advanced-topics.md)

**学习目标：** 补全前 12 章未覆盖的关键知识点

- 13.1 Script 组件：`next/script` 加载第三方脚本
- 13.2 静态导出：`output: 'export'` 纯静态站点
- 13.3 MDX 支持：Markdown + React 组件
- 13.4 环境变量详解：加载优先级、`NEXT_PUBLIC_*`、安全原则
- 13.5 SEO 完整方案：robots.txt / sitemap.xml / JSON-LD / OpenGraph
- 13.6 Proxy 与 Rewrites：API 代理、重定向、CORS
- 13.7 better-auth 认证：新一代认证库对比与集成
- 13.8 Cookies API 详解：读取、设置、删除、安全
- 13.9 Redirect 详解：`redirect()` vs `permanentRedirect()` vs 客户端跳转
- 13.10 中间件高级模式：链式中间件、执行顺序
- 13.11 国际化 (i18n)：路由国际化、翻译字典
- 13.12 PWA 支持：Service Worker + Manifest
- 13.13 Edge Runtime 详解：能力边界、适用场景
- 13.13 配置文件完整参考：`next.config.ts` 全选项

## [第十四章：Next.js 15 → 16 迁移指南](/chapters/14-migration-v16.md)

**学习目标：** 全面掌握 16.x 相比 15.x 的变更，安全迁移项目

- 14.1 破坏性变更速览
- 14.2 新增特性详解："use cache" / View Transitions / useEffectEvent
- 14.3 Reactor2Shell 安全漏洞修复
- 14.4 自动化迁移步骤与手动清单
- 14.5 15 vs 16 对比总表
- 14.6 学习路径建议

---

## 推荐学习节奏

| 周次 | 章节 | 重点 |
|------|------|------|
| 第1周 | 第1-2章 | 环境搭建 + 路由 |
| 第2周 | 第3-4章 | 渲染策略 + 数据获取 |
| 第3周 | 第5-6章 | Server Actions + 客户端交互 |
| 第4周 | 第7-8章 | 样式 + 认证 |
| 第5周 | 第9-10章 | 数据库 + 性能优化 |
| 第6周 | 第11章 | 测试 |
| 第7-8周 | 第12章 | 实战项目 |
| 第9周+ | 第13-14章 | 进阶补充 + 16.x 迁移 |

> 详细章节内容请查看 `chapters/` 目录下的对应文件。

---

## 环境

- Node.js >= 20
- 包管理：npm

## 开发命令

```bash
# 安装依赖
npm install

# 初始化数据库（含种子数据）
npx prisma db push
npx tsx src/lib/seed.ts

# 启动开发服务器
npm run dev
# → http://localhost:3000

# 生产构建
npm run build
npm start
```

## 电商实战项目

启动开发服务器后访问 `/shop` 进入 ShopNext 商城。

### 管理员账号

| 邮箱 | 密码 |
|------|------|
| admin@shopnext.com | admin123456 |

登录方式：访问 `/login` 或 `/admin`（会自动跳转登录页）。
