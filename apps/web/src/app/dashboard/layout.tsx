'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token === null && typeof window !== 'undefined') {
      const t = localStorage.getItem('dispatcher_token');
      if (!t) router.push('/login');
    }
  }, [token, router]);

  return <>{children}</>;
}
