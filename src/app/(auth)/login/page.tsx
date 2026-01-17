'use client';

import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121212]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-[#03DAC6]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#121212] px-4">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-[#2C2C2C]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-white">Finzo</CardTitle>
          <CardDescription className="text-white/60">
            Personal finance and task management app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton />
        </CardContent>
      </Card>
    </div>
  );
}
