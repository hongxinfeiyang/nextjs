# 第十一章：测试策略 — 单元 / 集成 / E2E 测试

---

## 11.1 测试金字塔

```
       ┌───────┐
       │  E2E   │  少而精：关键用户路径
       │  10%   │
       ├───────┤
       │ 集成   │  中等：组件间交互、API 调用
       │  30%   │
       ├───────┤
       │  单元  │  多而快：纯函数、工具函数
       │  60%   │
       └───────┘
```

### Next.js 测试工具链

| 层级 | 推荐工具 | 速度 | 覆盖范围 |
|------|---------|------|---------|
| 单元测试 | Vitest | 极快 | 函数、hooks、工具 |
| 组件测试 | Vitest + React Testing Library | 快 | 组件渲染、交互 |
| 集成测试 | Vitest + MSW | 中等 | API 调用、Server Actions |
| E2E | Playwright | 慢 | 完整用户流程 |

---

## 11.2 单元测试

### 环境配置

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

```jsonc
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 测试纯函数

```ts
// src/lib/utils.ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatPrice(price: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(price);
}
```

```ts
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, formatPrice } from '../utils';

describe('slugify', () => {
  it('将空格替换为连字符', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('移除特殊字符', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world');
  });

  it('处理中文字符', () => {
    expect(slugify('你好 世界')).toBe('你好-世界');
  });

  it('处理空字符串', () => {
    expect(slugify('')).toBe('');
  });

  it('去除头尾连字符', () => {
    expect(slugify(' -hello- ')).toBe('hello');
  });
});

describe('formatPrice', () => {
  it('格式化人民币', () => {
    expect(formatPrice(99.9)).toBe('¥99.90');
  });
});
```

### 测试 React 组件

```tsx
// src/components/__tests__/button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('渲染按钮文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument();
  });

  it('响应点击事件', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 状态下不响应点击', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        不可用
      </Button>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应用正确的 variant class', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-500');

    rerender(<Button variant="destructive">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-500');
  });
});
```

---

## 11.3 客户端组件测试

### 测试含 hooks 的组件

```tsx
// src/components/search-input.tsx
'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');

  const debouncedSearch = useDebouncedCallback((term: string) => {
    onSearch(term);
  }, 300);

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={e => {
          setValue(e.target.value);
          debouncedSearch(e.target.value);
        }}
        placeholder="搜索..."
        aria-label="搜索"
      />
      {value && (
        <button onClick={() => { setValue(''); onSearch(''); }} aria-label="清除">
          ✕
        </button>
      )}
    </div>
  );
}
```

```tsx
// src/components/__tests__/search-input.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchInput } from '../search-input';

// 模拟 use-debounce
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: Function) => fn, // 跳过 debounce，测试中直接调用
}));

describe('SearchInput', () => {
  it('输入文字后触发搜索', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    });

    expect(onSearch).toHaveBeenCalledWith('hello');
  });

  it('显示清除按钮并能清除输入', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    });

    fireEvent.click(screen.getByRole('button', { name: '清除' }));

    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('');
  });
});
```

---

## 11.4 Server Actions 测试

```ts
// src/app/__tests__/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPost } from '../actions';

// Mock 依赖
vi.mock('@/lib/db', () => ({
  db: {
    post: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('createPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未登录时抛出错误', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue(null);

    const formData = new FormData();
    formData.set('title', 'Test');
    formData.set('content', 'Test content here');

    await expect(createPost(formData)).rejects.toThrow('请先登录');
  });

  it('数据校验失败时返回错误', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    });

    const formData = new FormData();
    formData.set('title', 'AB'); // 太短，校验失败
    formData.set('content', 'Short'); // 太短，校验失败

    await expect(createPost(formData)).rejects.toThrow();
  });
});
```

---

## 11.5 E2E 测试：Playwright

### 安装与配置

```bash
npm install -D @playwright/test
npx playwright install
```

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 2,
  workers: 3,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 编写 E2E 测试

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('用户认证流程', () => {
  test('未登录用户访问受保护页面被重定向到登录页', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('完整登录流程', async ({ page }) => {
    await page.goto('/login');

    // 填写登录表单
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // 提交
    await page.click('button[type="submit"]');

    // 验证跳转到 dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('欢迎');
  });

  test('显示登录错误信息', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText('邮箱或密码错误');
  });
});
```

```ts
// e2e/products.spec.ts
import { test, expect } from '@playwright/test';

test.describe('产品浏览', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('显示产品列表', async ({ page }) => {
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(12);
  });

  test('搜索功能', async ({ page }) => {
    await page.fill('input[placeholder="搜索产品..."]', '手机');
    await page.waitForURL(/q=手机/);

    // 验证搜索结果
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toContainText('手机');
  });

  test('分页功能', async ({ page }) => {
    await page.click('a[aria-label="下一页"]');
    await page.waitForURL(/page=2/);

    await expect(page.locator('[aria-current="page"]')).toHaveText('2');
  });

  test('响应式布局 — 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // 应该显示单列布局
    const cards = page.locator('[data-testid="product-card"]');
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();

    // 单列布局下卡片宽度应接近视口宽度
    expect(box!.width).toBeGreaterThan(300);
  });
});
```

### 运行 E2E

```bash
# 运行所有 E2E
npx playwright test

# 以 UI 模式运行（可视化调试）
npx playwright test --ui

# 只运行某个文件
npx playwright test e2e/auth.spec.ts

# 查看报告
npx playwright show-report
```

---

## 11.6 数据库测试

```ts
// src/test/db-setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const TEST_DATABASE_URL = `${process.env.DATABASE_URL}_test`;

// 创建独立测试数据库
export async function setupTestDatabase() {
  // 使用模板数据库快速创建测试库
  try {
    execSync(`createdb ${TEST_DATABASE_URL.split('/').pop()} -T prisma_template`, {
      env: { ...process.env, PGPASSWORD: 'password' },
    });
  } catch {
    // 已存在则跳过
  }

  const db = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });

  // 运行迁移
  await db.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS public');
  return db;
}
```

```ts
// src/app/__tests__/posts-crud.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Posts CRUD (集成测试)', () => {
  let db: PrismaClient;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('创建文章', async () => {
    const post = await db.post.create({
      data: {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content here...',
        authorId: 'test-user-1',
      },
    });

    expect(post.title).toBe('Test Post');
    expect(post.slug).toBe('test-post');
  });

  it('查询已发布的文章', async () => {
    const posts = await db.post.findMany({
      where: { published: true },
    });

    expect(Array.isArray(posts)).toBe(true);
  });

  it('级联删除', async () => {
    // 删除用户时级联删除其所有文章和评论
    await db.user.delete({ where: { id: 'test-user-1' } });
    const posts = await db.post.findMany({
      where: { authorId: 'test-user-1' },
    });
    expect(posts).toHaveLength(0);
  });
});
```

---

## 11.7 快照测试与视觉回归

### 组件快照

```tsx
// src/components/__tests__/card.snapshot.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from '../card';

describe('Card 快照', () => {
  it('渲染内容不变', () => {
    const { container } = render(
      <Card>
        <h2>标题</h2>
        <p>内容</p>
      </Card>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### 视觉回归测试（Playwright）

```ts
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('视觉回归测试', () => {
  test('首页外观保持一致', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('暗色模式外观', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
```

---

## 11.8 CI 集成

```jsonc
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit"
  }
}
```

### 测试覆盖率目标

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 75,
        statements: 75,
      },
      exclude: [
        '*.config.*',
        'src/test/**',
        '.next/**',
      ],
    },
  },
});
```

---

## 练习

1. 为 `slugify` 和 `formatPrice` 工具函数编写完整的单元测试
2. 用 React Testing Library 测试一个包含多个 variant 的 Button 组件
3. 用 ViTest mock 编写 Server Action 的单元测试（包括认证和校验逻辑）
4. 用 Playwright 编写一个完整的用户注册 → 登录 → 创建内容的 E2E 测试
5. 为关键页面添加视觉回归测试快照
