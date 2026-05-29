/**
 * 登录页面
 *
 * 【文件职责】
 * - 提供用户邮箱密码登录表单
 * - 支持登录后重定向回来源页面（通过 URL 参数 redirect 控制）
 *
 * 【鉴权要求】
 * - 无需鉴权：未登录用户可访问
 *
 * 【组件架构】
 * - LoginForm（内部组件）：纯表单逻辑，使用 useSearchParams 获取重定向参数
 * - LoginPage（默认导出）：用 Suspense 包裹 LoginForm，避免 CSR 导致的服务端渲染回退问题
 */
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * 登录表单组件
 *
 * 使用 email/password 方式进行登录认证，支持回调重定向。
 * 需要被 Suspense 包裹使用，因为内部使用了 useSearchParams。
 */
function LoginForm() {
  const router = useRouter();
  // 读取 URL 参数，用于登录后跳转回来源页面
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /** 处理登录表单提交 */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // 使用 auth-client 的邮箱登录方法进行认证
    const result = await signIn.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      // 登录成功后的回调地址，优先使用 URL 中的 redirect 参数
      callbackURL: searchParams.get('redirect') || '/shop',
    });

    if (result?.error) {
      setError('邮箱或密码错误');
      setLoading(false);
      return;
    }

    // 登录成功后跳转到指定页面并刷新路由状态
    router.push(searchParams.get('redirect') || '/shop');
    router.refresh();
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-center text-2xl font-bold">登录</h1>

      {/* 错误提示区域 */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            邮箱
          </label>
          <Input id="email" name="email" type="email" placeholder="请输入邮箱" />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            密码
          </label>
          <Input id="password" name="password" type="password" placeholder="请输入密码" />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '登录中...' : '登录'}
        </Button>
      </form>

      {/* 跳转到注册页面的链接 */}
      <p className="mt-4 text-center text-sm text-gray-500">
        还没有账号？{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          注册
        </Link>
      </p>
    </div>
  );
}

/**
 * 登录页面入口组件
 *
 * 用 React Suspense 包裹 LoginForm，确保在客户端渲染过程中
 * useSearchParams 能正常使用而不触发 SSR 回退。
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"><h1 className="text-center text-2xl font-bold">加载中...</h1></div>}>
      <LoginForm />
    </Suspense>
  );
}
