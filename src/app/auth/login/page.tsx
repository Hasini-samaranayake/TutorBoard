'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BrandLogo from '@/components/BrandLogo';
import AuthSplitLayout from '@/components/marketing/AuthSplitLayout';
import AuthValuePanel, {
  type AuthAudience,
} from '@/components/marketing/AuthValuePanel';

export default function LoginPage() {
  const router = useRouter();
  const [audience, setAudience] = useState<AuthAudience>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await signIn(email, password);

      if (!data.user) {
        throw new Error('Login failed - no user returned');
      }

      router.push('/classes');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout panel={<AuthValuePanel audience={audience} />}>
      <div className="sprout-auth-card">
        <div className="mb-8 flex items-center gap-3">
          <BrandLogo size="md" showWordmark={false} />
          <div>
            <p className="sprout-wordmark text-2xl text-[var(--sprout-ink)]">
              Sprout
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
              Sign in
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-[var(--sprout-body)]">
          Sign in to continue. New here?{' '}
          <Link
            href={`/auth/register?role=${audience === 'teacher' ? 'teacher' : 'student'}`}
            className="font-medium text-[var(--sprout-ink)] underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              I am signing in as a
            </p>
            <div className="sprout-role-toggle">
              <button
                type="button"
                data-active={audience === 'student'}
                onClick={() => setAudience('student')}
              >
                Student
              </button>
              <button
                type="button"
                data-active={audience === 'teacher'}
                onClick={() => setAudience('teacher')}
              >
                Tutor
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="flex items-center justify-between">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[var(--sprout-ink)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-[var(--sprout-ink)] hover:bg-[#0b3f39] focus:ring-[var(--sprout-ink)]"
            isLoading={isLoading}
          >
            Sign in
          </Button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}
