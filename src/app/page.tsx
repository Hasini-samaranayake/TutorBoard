import Link from 'next/link';
import { BookOpen, Heart, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const highlights = [
  {
    icon: BookOpen,
    text: 'Short, step-by-step lessons you can finish in one sitting.',
  },
  {
    icon: Sparkles,
    text: 'Friendly feedback as you practice—no scary red pens.',
  },
  {
    icon: Heart,
    text: 'Your tutor can follow your streaks and nudge you when it helps.',
  },
];

export default function Home() {
  return (
    <div className="sprout-page-bg min-h-screen px-6 py-12">
      <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-xl flex-col items-center justify-center text-center">
        <BrandLogo size="lg" showWordmark={false} className="mb-6" />
        <h1 className="sprout-wordmark text-5xl text-[var(--sprout-ink)] sm:text-6xl">
          Sprout
        </h1>
        <p className="sprout-tagline-highlight mt-5 max-w-lg px-2 text-lg leading-relaxed text-[var(--sprout-body)] sm:text-xl">
          A cozy place for guided tutoring—bite-sized learning, gentle check-ins,
          and room to grow at your pace.
        </p>

        <ul className="mt-10 w-full space-y-4 text-left">
          {highlights.map((item) => (
            <li key={item.text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sprout-mint)] text-[var(--sprout-ink)]">
                <item.icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm leading-relaxed text-[var(--sprout-body)] sm:text-base">
                {item.text}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Link href="/auth/login" className="sprout-btn-primary w-full sm:flex-1">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="sprout-btn-secondary w-full sm:flex-1"
          >
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
}
