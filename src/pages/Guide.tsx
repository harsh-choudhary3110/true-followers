import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileJson,
  MailCheck,
  ShieldCheck,
  Upload,
  UserCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Seo from '../components/Seo';
import JsonLd from '../components/JsonLd';

interface Step {
  icon: LucideIcon;
  title: string;
  summary: string;
  path?: string[];
  badge?: string;
  highlight?: React.ReactNode;
  link?: { href: string; label: string };
}

const DYI_URL = 'https://accountscenter.instagram.com/info_and_permissions/dyi/';

const steps: Step[] = [
  {
    icon: Download,
    title: 'Open the data download page',
    summary: 'In the Instagram app or on the web, head to your download settings.',
    path: ['Settings', 'Accounts Center', 'Your information & permissions', 'Export your information'],
    link: { href: DYI_URL, label: 'Open download page' },
  },
  {
    icon: UserCog,
    title: 'Pick your account and data',
    summary: 'Select the Instagram account, choose Export to device (not an external service), then customize.',
    path: ['Export to device', 'Customize information'],
    highlight: (
      <>
        Tick <strong>Followers and following</strong>. (Selecting everything works too — it's just a
        bigger file.)
      </>
    ),
  },
  {
    icon: FileJson,
    title: 'Set the format to JSON',
    summary: 'HTML works too, but JSON includes follow dates. Date range can be All time.',
    path: ['Format', 'JSON'],
    badge: 'Recommended',
  },
  {
    icon: MailCheck,
    title: 'Start the export and wait for the email',
    summary: 'Instagram prepares your export and emails a download link — usually within minutes.',
    path: ['Start export'],
  },
  {
    icon: Upload,
    title: 'Download the ZIP and upload it here',
    summary: 'No need to unzip it — drop the ZIP straight onto True Followers.',
  },
];

function PathChips({ path }: { path: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {path.map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {seg}
          </span>
          {i < path.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
        </span>
      ))}
    </div>
  );
}

export default function Guide() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <Seo
        title="How to download your Instagram data (JSON) — True Followers"
        description="Step-by-step guide to export your Instagram followers and following as JSON: Settings → Accounts Center → Your information & permissions → Export your information."
        path="/guide"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to download your Instagram followers and following data',
          description:
            'Export your Instagram followers and following as a JSON file to analyze who doesn’t follow you back.',
          step: steps.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.title,
            text: s.summary,
          })),
        }}
      />
      {/* Header */}
      <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400">
        Setup guide
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        Get your Instagram data
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        True Followers works with your official Instagram export. Requesting it takes about a minute
        of taps — here's exactly where to click.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Clock className="h-3.5 w-3.5 text-fuchsia-500" /> ~1 minute of clicks
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> No login needed
        </span>
      </div>

      {/* Critical callout */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>JSON is recommended.</strong> True Followers reads both JSON and HTML exports — but
          only JSON includes the follow dates, so you can sort by date. Pick JSON if you can.
        </p>
      </div>

      {/* Timeline */}
      <ol className="relative mt-12 space-y-5">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={i} className="relative flex gap-4 sm:gap-5">
              {/* connector to the next step only (never below the last) */}
              {i < steps.length - 1 && (
                <span
                  className="pointer-events-none absolute left-[1.375rem] top-11 -bottom-5 w-px bg-fuchsia-400/50 dark:bg-fuchsia-500/30"
                  aria-hidden="true"
                />
              )}
              <span className="icon-tile relative z-10 h-11 w-11 shrink-0 rounded-full text-base font-bold">
                {i + 1}
              </span>
              <div className="card-hover flex-1 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" strokeWidth={2} />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  {step.badge && (
                    <span className="rounded-full bg-gradient-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                      {step.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-slate-600 dark:text-slate-300">{step.summary}</p>
                {step.path && <PathChips path={step.path} />}
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-4 !px-4 !py-2 text-sm"
                  >
                    {step.link.label} <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {step.highlight && (
                  <p className="mt-3 rounded-lg border border-fuchsia-200/70 bg-fuchsia-50 px-3 py-2 text-sm text-fuchsia-900 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-100">
                    {step.highlight}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Patience note */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-600" />
        <p>
          Instagram occasionally takes longer to prepare the file. If it's not ready yet, keep the
          email and come back once the download link arrives.
        </p>
      </div>

      {/* CTA */}
      <div className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-brand p-8 text-center shadow-2xl shadow-fuchsia-500/20">
        <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
        <div className="relative">
          <CheckCircle2 className="mx-auto h-10 w-10 text-white" />
          <h2 className="mt-3 text-2xl font-bold text-white">Got your ZIP?</h2>
          <p className="mt-1 text-white/85">
            Upload it now — the comparison runs entirely in your browser.
          </p>
          <Link
            to="/upload"
            className="btn mt-5 bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg hover:-translate-y-0.5 hover:bg-slate-50"
          >
            Go to upload <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
