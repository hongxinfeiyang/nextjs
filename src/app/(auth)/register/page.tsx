/**
 * 注册页面
 *
 * 【文件职责】
 * - 提供新用户注册表单，包含姓名、邮箱、密码
 * - 注册成功后自动跳转至商城首页
 *
 * 【鉴权要求】
 * - 无需鉴权：未登录用户可访问
 *
 * 【注意】
 * - 注册成功后直接跳转到 /shop，不会发送验证邮件等后续流程
 * - 密码最短长度为 8 位
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * 注册页面组件
 *
 * 收集用户姓名、邮箱、密码，调用 signUp.email 创建账号。
 * 成功后自动跳转到商城首页。
 */
export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /** 处理注册表单提交 */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // 调用 auth-client 的邮箱注册 API 创建新用户
    const result = await signUp.email({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });

    // 处理注册失败，显示服务端返回的错误信息
    if (result.error) {
      setError(result.error.message || '注册失败，请稍后重试');
      setLoading(false);
      return;
    }

    // 注册成功后跳转到商城首页并刷新路由
    router.push('/shop');
    router.refresh();
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-center text-2xl font-bold">创建账号</h1>

      {/* 错误提示区域 */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            姓名
          </label>
          <Input id="name" name="name" required placeholder="请输入姓名" />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            邮箱
          </label>
          <Input id="email" name="email" type="email" required placeholder="请输入邮箱" />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            密码
          </label>
          {/* 密码最短 8 位，前端 HTML5 校验 */}
          <Input id="password" name="password" type="password" required minLength={8} placeholder="至少8位密码" />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '注册中...' : '注册'}
        </Button>
      </form>

      {/* 跳转到登录页面的链接 */}
      <p className="mt-4 text-center text-sm text-gray-500">
        已有账号？{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}
