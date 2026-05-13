import type { LucideIcon } from 'lucide-react';
import { BookOpen, Heart, Sparkles, Users } from 'lucide-react';

export type AuthAudience = 'student' | 'teacher';

type Feature = {
  icon: LucideIcon;
  text: string;
};

const audienceCopy: Record<
  AuthAudience,
  { subtitle: string; features: Feature[] }
> = {
  student: {
    subtitle:
      'Guided tutoring platform for step-by-step learning and tutor support.',
    features: [
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
    ],
  },
  teacher: {
    subtitle:
      'Guided tutoring platform for step-by-step learning and tutor support.',
    features: [
      {
        icon: Users,
        text: 'See your roster, streaks, and who needs a nudge at a glance.',
      },
      {
        icon: Sparkles,
        text: 'Rule-based alerts surface follow-ups without extra spreadsheets.',
      },
      {
        icon: BookOpen,
        text: 'Open any linked student to review lessons and notes in context.',
      },
    ],
  },
};

type AuthValuePanelProps = {
  audience: AuthAudience;
};

export default function AuthValuePanel({ audience }: AuthValuePanelProps) {
  const copy = audienceCopy[audience];

  return (
    <div className="max-w-md">
      <h1 className="sprout-wordmark text-5xl sm:text-6xl text-[var(--sprout-ink)]">
        Sprout
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--sprout-body)] leading-relaxed">
        {copy.subtitle}
      </p>
      <ul className="mt-8 space-y-4">
        {copy.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sprout-mint)] text-[var(--sprout-ink)]">
              <feature.icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm sm:text-base text-[var(--sprout-body)] leading-relaxed">
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
