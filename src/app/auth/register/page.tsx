'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { UserRole } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BrandLogo from '@/components/BrandLogo';
import AuthSplitLayout from '@/components/marketing/AuthSplitLayout';
import AuthValuePanel from '@/components/marketing/AuthValuePanel';

function RegisterPageFallback() {
  return (
    <div className="sprout-page-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="sprout-auth-card w-full max-w-md text-center text-[var(--sprout-body)]">
        Loading...
      </div>
    </div>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const initialRole = searchParams.get('role');
    if (initialRole === 'teacher' || initialRole === 'student') {
      setRole(initialRole);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, name, role);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="sprout-page-bg flex min-h-screen items-center justify-center px-4 py-12">
        <div className="sprout-auth-card w-full max-w-md text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sprout-mint)]">
            <svg
              className="h-8 w-8 text-[var(--sprout-ink)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="sprout-wordmark text-2xl text-[var(--sprout-ink)]">
            Check your email
          </h1>
          <p className="mt-3 text-[var(--sprout-body)]">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Please click the link to verify your account.
          </p>
          <Link href="/auth/login" className="mt-6 block">
            <Button
              variant="secondary"
              className="w-full rounded-full border border-gray-200"
            >
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const audience = role === 'teacher' ? 'teacher' : 'student';

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
              Create account
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-[var(--sprout-body)]">
          Join Sprout today. Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-[var(--sprout-ink)] underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">I am a</p>
            <div className="sprout-role-toggle">
              <button
                type="button"
                data-active={role === 'student'}
                onClick={() => setRole('student')}
              >
                Student
              </button>
              <button
                type="button"
                data-active={role === 'teacher'}
                onClick={() => setRole('teacher')}
              >
                Tutor
              </button>
            </div>
          </div>

          <Input
            id="name"
            type="text"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />

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

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            className="w-full rounded-full bg-[var(--sprout-ink)] hover:bg-[#0b3f39] focus:ring-[var(--sprout-ink)]"
            isLoading={isLoading}
          >
            Create account
          </Button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
