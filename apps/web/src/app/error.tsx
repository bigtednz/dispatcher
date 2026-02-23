'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-xl font-semibold text-slate-200">Something went wrong</h1>
      <p className="mb-4 max-w-md text-center text-sm text-slate-400">{error.message}</p>
      <button
        onClick={reset}
        className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
      >
        Try again
      </button>
    </div>
  );
}
