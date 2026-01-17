'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      router.push('/finance');
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      size="lg"
      className="w-full"
    >
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
