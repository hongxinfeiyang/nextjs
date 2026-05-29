'use client';

import { useState, useOptimistic } from 'react';

export function OptimisticDemo() {
  const [likes, setLikes] = useState(42);
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (s: number, n: number) => s + n);

  const handleLike = async () => {
    addOptimistic(1);                           // 1. 立即更新 UI
    await new Promise(r => setTimeout(r, 800)); // 2. 模拟请求延迟
    setLikes(l => l + 1);                       // 3. 服务端确认
  };

  return (
    <div className="rounded-xl border p-6 text-center">
      <p className="mb-2 text-5xl font-bold">{optimisticLikes}</p>
      <p className="mb-4 text-sm text-gray-500">点赞数（点击后立即 +1，不等服务端响应）</p>
      <button
        onClick={handleLike}
        className="rounded-full bg-pink-500 px-6 py-2 text-white font-bold hover:bg-pink-600 transition-all active:scale-95"
      >
        👍 点赞（乐观更新）
      </button>
      <p className="mt-2 text-xs text-gray-400">
        实际 likes: {likes}（800ms 后同步到真实值）
      </p>
    </div>
  );
}
