import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  LineChart,
  Lock,
  ScanSearch,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Seo from "../components/Seo";

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Lock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-hover group p-6">
      <div className="flex items-center gap-3">
        <span className="icon-tile h-11 w-11 shrink-0 transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {children}
      </p>
    </div>
  );
}

/** Static "show, don't tell" preview of the results dashboard (sample data). */
function HeroPreview() {
  const stats = [
    { label: 'Followers', value: '1,204', icon: Users, accent: 'text-fuchsia-500' },
    { label: 'Following', value: '890', icon: UserPlus, accent: 'text-fuchsia-500' },
    { label: 'Mutuals', value: '812', icon: Heart, accent: 'text-rose-500' },
    { label: 'Non-followers', value: '78', icon: UserMinus, accent: 'text-amber-500' },
  ];
  const rows = [
    { u: 'alex.designs', since: 'Mar 2, 2023', c: 'bg-violet-500' },
    { u: 'travel.with.mia', since: 'Jul 18, 2024', c: 'bg-emerald-500' },
    { u: 'dev.newsdaily', since: 'Nov 5, 2022', c: 'bg-sky-500' },
  ];
  return (
    <div className="relative mx-auto mt-14 max-w-4xl sm:mt-16" aria-hidden="true">
      <div className="pointer-events-none absolute -inset-x-6 -top-4 bottom-4 -z-10 rounded-[2rem] bg-gradient-brand opacity-20 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#0f1119]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 hidden text-xs text-slate-400 sm:block">Your results</span>
        </div>
        {/* stat tiles */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {s.label}
                  </span>
                  <Icon className={`h-4 w-4 ${s.accent}`} />
                </div>
                <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {s.value}
                </p>
              </div>
            );
          })}
        </div>
        {/* list preview */}
        <div className="px-4 pb-5">
          <div className="mb-2 inline-block border-b-2 border-fuchsia-600 pb-1 text-sm font-semibold text-fuchsia-600 dark:border-fuchsia-400 dark:text-fuchsia-400">
            Don't follow you back (78)
          </div>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
            {rows.map((r) => (
              <div key={r.u} className="flex items-center gap-3 px-3 py-2.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${r.c}`}>
                  {r.u.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    @{r.u}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Following since {r.since}</p>
                </div>
                <span className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                  Profile
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* bottom fade — implies the list continues */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white dark:to-[#0f1119]" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Seo
        title="True Followers — See who doesn't follow you back on Instagram"
        description="Free, private Instagram follower tracker. Upload your data export to find who doesn't follow you back, who you don't follow back, mutuals, and track unfollowers — 100% in your browser, no login."
        path="/"
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Atmospheric multi-color glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-12rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-400/25 blur-[120px] dark:bg-violet-600/20" />
          <div className="absolute left-[15%] top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-fuchsia-400/20 blur-[110px] dark:bg-fuchsia-600/15" />
          <div className="absolute right-[12%] top-[-4rem] h-[24rem] w-[24rem] rounded-full bg-orange-300/20 blur-[110px] dark:bg-orange-500/10" />
        </div>
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, #000 60%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, #000 60%, transparent 100%)",
            color: "#94a3b8",
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-brand">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </span>
            100% private · runs entirely in your browser
          </span>

          <h1 className="mx-auto mt-6 max-w-5xl text-[2rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:mt-7 sm:text-6xl sm:leading-[1.05] dark:text-white">
            See who doesn't
            <br className="hidden sm:block" />{" "}
            <span className="text-gradient">follow you back</span> on Instagram
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Upload your Instagram data export and instantly find non-followers,
            fans you haven't followed back, and your mutuals — without ever
            sharing your password.
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/upload"
              className="btn-primary w-full px-6 py-3 text-base sm:w-auto"
            >
              Upload your export <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/guide"
              className="btn-secondary w-full px-6 py-3 text-base sm:w-auto"
            >
              How to get your data
            </Link>
          </div>
          <p className="mt-5 text-xs font-medium text-slate-400">
            No login · No password · Nothing leaves your device
          </p>

          <HeroPreview />
        </div>
      </section>

      {/* Features */}
      <section className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Feature icon={Lock} title="Your data never leaves your browser">
            There's no server. The comparison runs entirely in your browser — we
            literally can't see your data.
          </Feature>
          <Feature icon={Zap} title="Instant results">
            Drop in your export ZIP and get every list in a second, even with
            tens of thousands of followers.
          </Feature>
          <Feature icon={ScanSearch} title="No password required">
            Unlike sketchy apps, we never ask you to log in. You only use your
            own official data export.
          </Feature>
          <Feature icon={Sparkles} title="Track unfollowers over time">
            Save snapshots and compare later to see exactly who unfollowed you
            since last time.
          </Feature>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Three simple steps
          </h2>
        </div>
        <div className="relative mt-14 grid gap-10 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Request your data",
              d: "Ask Instagram for your information in JSON format. It arrives by email, usually within minutes.",
            },
            {
              n: "2",
              t: "Upload the ZIP",
              d: "Drag the downloaded ZIP onto True Followers. It reads the followers and following files locally.",
            },
            {
              n: "3",
              t: "See your results",
              d: "Browse who doesn't follow back, your mutuals, and more. Export any list to CSV.",
            },
          ].map((s, i, arr) => (
            <div key={s.n} className="relative text-center md:text-left">
              {/* connector to the next step only (never after the last) */}
              {i < arr.length - 1 && (
                <span className="pointer-events-none absolute left-6 right-[-4rem] top-6 hidden h-px bg-gradient-to-r from-fuchsia-400/70 to-fuchsia-300/40 md:block dark:from-fuchsia-500/40 dark:to-fuchsia-500/20" />
              )}
              <span className="icon-tile relative z-10 mx-auto h-12 w-12 text-lg font-bold md:mx-0">
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                {s.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {s.d}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/guide" className="btn-secondary">
            See the full step-by-step guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Question-shaped content (SEO / answer engines) */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400">
            Good to know
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Common questions
          </h2>
        </div>

        <div className="mt-10 space-y-5">
          {[
            {
              icon: ScanSearch,
              q: "How to see who doesn't follow you back on Instagram",
              a: (
                <>
                  Instagram doesn't show non-followers directly, so True
                  Followers uses your official data export. Request your
                  information in JSON format, download the ZIP, and{" "}
                  <Link
                    to="/upload"
                    className="font-medium text-fuchsia-600 underline dark:text-fuchsia-400"
                  >
                    upload it here
                  </Link>
                  . In a second you'll see everyone you follow who doesn't
                  follow you back — searchable, sortable, and exportable to CSV.
                  Nothing is uploaded to a server.
                </>
              ),
            },
            {
              icon: LineChart,
              q: "How to find out who unfollowed you",
              a: (
                <>
                  Save a snapshot of your followers today, then upload a fresh
                  export later and compare the two. The{" "}
                  <Link
                    to="/tracker"
                    className="font-medium text-fuchsia-600 underline dark:text-fuchsia-400"
                  >
                    unfollower tracker
                  </Link>{" "}
                  shows exactly who unfollowed you, who's new, and how your
                  counts changed over time.
                </>
              ),
            },
            {
              icon: Lock,
              q: "Is it safe? Do you need my password?",
              a: (
                <>
                  It's completely safe and free. True Followers never asks you
                  to log in and never touches Instagram — you only use your own
                  data export, processed locally in your browser. See the{" "}
                  <Link
                    to="/faq"
                    className="font-medium text-fuchsia-600 underline dark:text-fuchsia-400"
                  >
                    FAQ
                  </Link>{" "}
                  for more.
                </>
              ),
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.q} className="card flex gap-4 p-6">
                <span className="icon-tile h-11 w-11 shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.q}
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Glossary */}
        <h3 className="mt-12 text-center text-lg font-semibold text-slate-900 dark:text-white">
          Followers, following &amp; mutuals
        </h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              term: "Non-follower",
              def: "someone you follow who doesn't follow you back.",
              cls: "text-amber-600 dark:text-amber-400",
            },
            {
              term: "Fan",
              def: "someone who follows you that you don't follow back.",
              cls: "text-sky-600 dark:text-sky-400",
            },
            {
              term: "Mutual",
              def: "you and the other account follow each other.",
              cls: "text-rose-600 dark:text-rose-400",
            },
          ].map((g) => (
            <div key={g.term} className="card p-5">
              <p className={`font-semibold ${g.cls}`}>{g.term}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {g.def}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 text-center shadow-2xl shadow-fuchsia-500/20 sm:p-14">
          {/* glow accents inside the band */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to see your true followers?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              It's free, private, and takes less than a minute once your export
              is ready.
            </p>
            <Link
              to="/upload"
              className="btn mt-7 bg-white px-7 py-3.5 text-base font-semibold text-slate-900 shadow-lg hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Get started <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
