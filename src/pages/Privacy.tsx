import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Seo from '../components/Seo';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </div>
  );
}

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Seo
        title="Privacy — True Followers"
        description="How True Followers handles your data: everything runs in your browser, nothing is uploaded, no accounts, no ads, no cookies. Your Instagram data never leaves your device."
        path="/privacy"
      />

      <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400">
        Privacy
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        Your data stays yours
      </h1>

      {/* TL;DR */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" />
        <p className="leading-relaxed">
          <strong>The short version:</strong> True Followers has no server that stores your data.
          Everything is processed inside your browser. We never see your follower list, never ask
          for your password, and nothing is ever uploaded.
        </p>
      </div>

      <div className="mt-10 space-y-10">
        <Section title="What we process">
          <p>
            The only thing you give us is your own official Instagram data export (a ZIP, JSON, or
            HTML file you download from Instagram). It's read and compared entirely in your browser
            — it never travels to any server, ours or anyone else's.
          </p>
        </Section>

        <Section title="What's stored on your device">
          <p>A couple of things are saved locally, only in this browser, and never sent anywhere:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Your theme choice</strong> (light/dark) — in <code>localStorage</code>.
            </li>
            <li>
              <strong>Snapshots you save</strong> for the unfollower tracker — in your browser's
              IndexedDB. You can delete them anytime, or export them as a backup file you control.
            </li>
          </ul>
          <p>Clearing your browser's site data removes all of it.</p>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc space-y-1 pl-5">
            <li>No accounts, no ads, no cookies, no cross-site tracking or profiling.</li>
            <li>
              The only thing we measure is anonymous, cookieless page-view counts (via Vercel Web
              Analytics) — it never sees your Instagram data and never identifies you.
            </li>
            <li>We never sell or share your data — it never leaves your device, so there's nothing to sell.</li>
          </ul>
        </Section>
      </div>

      <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
        Questions? See the{' '}
        <Link to="/faq" className="font-medium text-fuchsia-600 underline dark:text-fuchsia-400">
          FAQ
        </Link>
        .
      </p>
    </div>
  );
}
