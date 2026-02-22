import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-2xl font-bold">Fire Dispatch Simulator</h1>
      <p className="mb-6 text-slate-400">Waikato — Morrinsville-centred</p>
      <Link
        href="/login"
        className="rounded bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500"
      >
        Log in
      </Link>
      <Link
        href="/dashboard"
        className="mt-3 text-sm text-slate-400 hover:text-slate-200"
      >
        Go to dashboard (if already logged in)
      </Link>
    </main>
  );
}
