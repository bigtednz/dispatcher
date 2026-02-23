'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-NZ">
      <body style={{ margin: 0, padding: '2rem', fontFamily: 'system-ui', background: '#0f172a', color: '#e2e8f0' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>{error.message}</p>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            background: '#d97706',
            color: '#fff',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
