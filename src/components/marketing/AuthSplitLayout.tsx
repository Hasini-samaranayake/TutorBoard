import type { ReactNode } from 'react';

type AuthSplitLayoutProps = {
  panel: ReactNode;
  children: ReactNode;
};

export default function AuthSplitLayout({ panel, children }: AuthSplitLayoutProps) {
  return (
    <div className="sprout-page-bg min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-16">
        <div className="lg:pr-4">{panel}</div>
        <div className="w-full justify-self-center">{children}</div>
      </div>
    </div>
  );
}
