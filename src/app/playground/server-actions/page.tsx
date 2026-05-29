'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitForm, type FormState } from './actions';

const initialState: FormState = { success: false, message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-6 py-2.5 text-white font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
    >
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

export default function ServerActionsDemoPage() {
  const [state, formAction] = useActionState(submitForm, initialState);

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold">Server Actions 表单</h1>
        <p className="mb-8 text-gray-500">
          演示 Server Action + Zod 校验 + useActionState + useFormStatus。
          数据在服务端校验，成功后返回结果。
        </p>

        <form action={formAction} className="rounded-xl border p-6 space-y-4">
          {/* 结果提示 */}
          {state.message && (
            <div className={`rounded-lg p-3 text-sm ${state.success ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
              {state.message}
            </div>
          )}

          {/* 成功时展示数据 */}
          {state.success && state.data && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
              <p><strong>姓名：</strong>{state.data.name}</p>
              <p><strong>邮箱：</strong>{state.data.email}</p>
              <p><strong>留言：</strong>{state.data.message}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">姓名</label>
            <input id="name" name="name" className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="至少 2 个字符" />
            {state.errors?.name && <p className="mt-1 text-xs text-red-500">{state.errors.name[0]}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">邮箱</label>
            <input id="email" name="email" type="email" className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="example@mail.com" />
            {state.errors?.email && <p className="mt-1 text-xs text-red-500">{state.errors.email[0]}</p>}
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium">留言</label>
            <textarea id="message" name="message" rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="至少 10 个字符" />
            {state.errors?.message && <p className="mt-1 text-xs text-red-500">{state.errors.message[0]}</p>}
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
