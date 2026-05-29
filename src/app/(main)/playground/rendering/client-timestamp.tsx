'use client';
import { useState, useEffect } from 'react';

export function ClientTimestamp() {
  const [time, setTime] = useState('--');
  useEffect(() => { setTime(new Date().toLocaleString('zh-CN')); }, []);
  return <>{time}</>;
}
