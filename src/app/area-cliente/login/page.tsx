'use client';

import { useState, FormEvent } from 'react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield } from 'lucide-react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { maskCpf } from '@/lib/utils';

export default function CustomerLoginPage() {
  const { login, isLoading: authIsLoading } = useCustomerAuth();
  const { isLoading: dataIsLoading } = useData();
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const normalizedCpf = cpf.replace(/\D/g, ''); // Remove non-digit characters
    login(normalizedCpf, password);
  };
  
  const isLoading = authIsLoading || dataIsLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <User className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">Área do Cliente</CardTitle>
          <CardDescription>Acesse seus pedidos e informações.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    inputMode="numeric"
                    maxLength={14}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Carregando...' : 'Entrar'}
                </Button>
                <Button variant="link" size="sm" className="text-muted-foreground" asChild>
                    <Link href="/">Voltar para a loja</Link>
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
