
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-muted/30">
      {mounted && (
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <Sun className="hidden sm:block h-4 w-4 text-muted-foreground" aria-hidden />
          <Switch
            checked={resolvedTheme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            aria-label="Alternar tema claro/escuro"
          />
          <Moon className="hidden sm:block h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      )}
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          <CardDescription>Faça login para acessar o painel administrativo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                id="username"
                type="text"
                placeholder="admin, gerente ou vendedor"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                id="password"
                type="password"
                placeholder="senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full">
                    Entrar
                </Button>
                <Button variant="link" size="sm" className="text-muted-foreground" asChild>
                  <Link href="/">Ir para o Catálogo</Link>
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
