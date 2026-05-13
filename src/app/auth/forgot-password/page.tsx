'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BrandLogo from '@/components/BrandLogo';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="sprout-wordmark text-2xl text-[var(--sprout-ink)]">
            Check your email
          </h1>
          <p className="mt-3 text-[var(--sprout-body)]">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
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

  return (
    <div className="sprout-page-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="sprout-auth-card w-full max-w-md">
        <Link
          href="/auth/login"
          className="mb-6 inline-flex items-center text-[var(--sprout-body)] hover:text-[var(--sprout-ink)]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <BrandLogo size="lg" showWordmark={false} />
          </div>
          <h1 className="sprout-wordmark text-2xl text-[var(--sprout-ink)]">
            Forgot your password?
          </h1>
          <p className="mt-2 text-[var(--sprout-body)]">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button
            type="submit"
            className="w-full rounded-full bg-[var(--sprout-ink)] hover:bg-[#0b3f39] focus:ring-[var(--sprout-ink)]"
            isLoading={isLoading}
          >
            Send reset link
          </Button>
        </form>
      </div>
    </div>
  );
}
