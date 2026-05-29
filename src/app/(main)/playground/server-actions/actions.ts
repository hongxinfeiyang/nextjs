'use server';

import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, '姓名至少 2 个字符'),
  email: z.string().email('邮箱格式不正确'),
  message: z.string().min(10, '留言至少 10 个字符'),
});

export type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: { name: string; email: string; message: string };
};

export async function submitForm(prev: FormState, formData: FormData): Promise<FormState> {
  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 1000));

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    message: formData.get('message') as string,
  };

  const result = schema.safeParse(raw);

  if (!result.success) {
    return {
      success: false,
      message: '校验失败，请修正以下错误',
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    success: true,
    message: `提交成功！你好 ${result.data.name}，我们会回复到 ${result.data.email}。`,
    data: result.data,
  };
}
