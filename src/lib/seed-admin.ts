async function createAdmin() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004';

  // Sign up via better-auth API
  const signUpRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@shopnext.com',
      password: 'admin123456',
      name: '管理员',
    }),
  });

  const signUpData = await signUpRes.json();

  if (!signUpRes.ok && signUpData.code !== 'USER_ALREADY_EXISTS') {
    console.error('Sign-up failed:', signUpData);
    process.exit(1);
  }

  // If user already exists, just update role
  const { db } = await import('@/lib/db');
  await db.user.update({
    where: { email: 'admin@shopnext.com' },
    data: { role: 'ADMIN' },
  });

  console.log('Admin user ready: admin@shopnext.com');
  console.log('Password: admin123456');
}

createAdmin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
