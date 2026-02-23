import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-xl font-semibold text-slate-200">Page not found</h1>
      <p className="mb-4 text-sm text-slate-400">The page you’re looking for doesn’t exist.</p>
      <Link
        href="/"
        className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
      >
        Go home
      </Link>
    </div>
  );
}
