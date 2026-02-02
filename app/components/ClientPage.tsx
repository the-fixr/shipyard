'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from './ErrorBoundary';

const Demo = dynamic(() => import('./Demo'), {
  ssr: false,
});

export default function ClientPage() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen flex flex-col p-4">
        <Demo />
      </main>
    </ErrorBoundary>
  );
}
