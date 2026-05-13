import Link from 'next/link';
import {
  BarChart,
  BookOpen,
  Clock,
  FileText,
  Pencil,
  Users,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const highlights = [
  {
    icon: BookOpen,
    text: 'Short, step-by-step lessons you can finish in one sitting.',
  },
  {
    icon: Pencil,
    text: 'Friendly feedback as you practice—no scary red pens.',
  },
  {
    icon: Users,
    text: 'Your tutor can follow your streaks and nudge you when it helps.',
  },
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

export default function Home() {
  return (
    <div className="sprout-page-bg min-h-screen px-6 py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <section className="flex w-full max-w-xl flex-col items-center text-center">
          <BrandLogo size="xl" showWordmark={false} className="mb-6" />
          <h1 className="sprout-wordmark text-5xl text-[var(--sprout-ink)] sm:text-6xl">
            Sprout
          </h1>
          <p className="sprout-tagline-highlight mt-5 max-w-lg px-2 text-lg leading-relaxed text-[var(--sprout-body)] sm:text-xl">
            bite-sized learning, gentle check-ins, and room to grow at your pace.
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

        <section className="mt-16 w-full">
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
                Built for tutoring, not generic whiteboards
              </h2>
              <p className="mt-4 text-[var(--sprout-body)]">
                Sprout keeps lessons, homework, and student follow-up in one
                calm workspace so tutors can teach and students can grow without
                fighting the tools.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--sprout-body)] sm:text-base">
                <li>Save and reopen lesson boards anytime</li>
                <li>Students can annotate lessons without changing the original</li>
                <li>Automatic homework due date reminders</li>
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
