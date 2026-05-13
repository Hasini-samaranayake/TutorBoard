import Link from 'next/link';
import {
  BarChart,
  BookOpen,
  Check,
  Clock,
  FileText,
  Heart,
  Pencil,
  Sparkles,
  Users,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { studentHighlights } from '@/lib/marketing-copy';

const highlights = [
  { icon: BookOpen, text: studentHighlights[0] },
  { icon: Sparkles, text: studentHighlights[1] },
  { icon: Heart, text: studentHighlights[2] },
];

const features = [
  {
    icon: <Pencil className="h-5 w-5" />,
    title: 'Intuitive drawing tools',
    description:
      'Pen, highlighter, shapes, and eraser for explaining concepts visually.',
  },
  {
    icon: <span className="text-base font-bold">∑</span>,
    title: 'Math equation editor',
    description:
      'Built-in LaTeX support for writing clear formulas and equations.',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Lesson templates',
    description:
      'Graph paper, coordinate planes, and lined paper ready when you need them.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Student profiles',
    description:
      'Each student has a home for lessons, homework, and progress.',
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Lesson timer',
    description:
      'Built-in timer with break reminders to keep sessions on track.',
  },
  {
    icon: <BarChart className="h-5 w-5" />,
    title: 'Progress tracking',
    description:
      'See homework completion and spot who may need a little extra help.',
  },
];

const tutorBenefits = [
  'Save and reopen lesson boards anytime',
  'Students can annotate lessons without changing the original',
  'Automatic homework due date reminders',
];

export default function Home() {
  return (
    <div className="sprout-page-bg min-h-screen px-6 py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <section className="flex w-full max-w-xl flex-col items-center text-center">
          <BrandLogo size="hero" showWordmark={false} className="mb-6" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800/75">
            Grow every lesson
          </p>
          <h1 className="sprout-wordmark mt-3 text-5xl text-[var(--sprout-ink)] sm:text-6xl">
            Sprout
          </h1>
          <p className="sprout-tagline-highlight mt-5 max-w-lg px-2 text-lg leading-relaxed text-[var(--sprout-body)] sm:text-xl">
            Bite-sized learning, gentle check-ins, and room to grow at your pace.
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
        </section>

        <section className="mt-20 w-full">
          <div className="mb-8 text-center">
            <h2 className="sprout-wordmark text-3xl text-[var(--sprout-ink)]">
              Tools for calm, effective tutoring
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[var(--sprout-body)]">
              Everything you need to teach, review, and follow up in one place.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="mt-12 w-full rounded-3xl border border-white/70 bg-white/90 p-8 shadow-lg shadow-emerald-950/5 sm:p-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="text-left">
              <h2 className="sprout-wordmark text-3xl text-[var(--sprout-ink)]">
                Built for tutors, by tutors
              </h2>
              <p className="mt-4 text-[var(--sprout-body)]">
                Sprout keeps lessons, homework, and student follow-up in one
                calm workspace so tutors can teach and students can grow without
                fighting the tools.
              </p>
              <ul className="mt-6 space-y-3">
                {tutorBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-sm text-[var(--sprout-body)] sm:text-base"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sprout-mint)] text-[var(--sprout-ink)]">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--sprout-mint)]/40">
              <div className="text-center text-[var(--sprout-body)]">
                <BookOpen className="mx-auto mb-2 h-14 w-14 opacity-70" />
                <p className="text-sm font-medium">Whiteboard preview</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-16 flex w-full max-w-5xl items-center justify-between border-t border-emerald-900/10 pt-8">
        <BrandLogo size="sm" />
        <p className="text-sm text-[var(--sprout-body)]">
          Built for tutors, by tutors.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sprout-mint)] text-[var(--sprout-ink)]">
        {icon}
      </div>
      <h3 className="font-semibold text-[var(--sprout-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--sprout-body)]">
        {description}
      </p>
    </article>
  );
}
