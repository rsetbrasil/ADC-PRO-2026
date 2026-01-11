'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/pedidos');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Redirecionando para o painel...</p>
    </div>
  );
}
