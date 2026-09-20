import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  EyeOff,
  FileJson,
  KeyRound,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Dropzone from "../components/Dropzone";
import Seo from "../components/Seo";
import { ParseError, parseFiles } from "../lib/parser";
import { useStore } from "../store";

const assurances: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Runs on your device",
    body: "Parsing happens in your browser. No file is ever uploaded to a server.",
  },
  {
    icon: KeyRound,
    title: "No password, ever",
    body: "You only use your own official export. We never ask you to log in.",
  },
  {
    icon: EyeOff,
    title: "No tracking",
    body: "No accounts, no analytics on your data, nothing stored remotely.",
  },
];

export default function Upload() {
  const navigate = useNavigate();
  const setData = useStore((s) => s.setData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    setError(null);
    setLoading(true);
    try {
      const data = await parseFiles(files);
      if (data.followers.length === 0 && data.following.length === 0) {
        setError(
          'We couldn\'t find any follower or following data in that file. Make sure you exported in JSON format and included "Followers and following".',
        );
        setLoading(false);
        return;
      }
      setData(data);
      navigate("/results");
    } catch (err) {
      setError(
        err instanceof ParseError
          ? err.message
          : "Something went wrong reading that file. Please try again.",
      );
      setLoading(false);
    }
  }

  async function handleSample() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}sample-instagram-export.zip`,
      );
      if (!res.ok) throw new Error("missing");
      const blob = await res.blob();
      const file = new File([blob], "sample-instagram-export.zip", {
        type: "application/zip",
      });
      const data = await parseFiles([file]);
      setData(data);
      navigate("/results");
    } catch {
      setError(
        "Could not load the sample data. Please try uploading your own export instead.",
      );
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden">
      <Seo
        title="Upload your Instagram export — True Followers"
        description="Drop your Instagram data export (ZIP, JSON or HTML) to instantly see who doesn't follow you back. Processed entirely in your browser — nothing is uploaded."
        path="/upload"
      />
      {/* subtle background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-400/15 blur-[120px] dark:bg-fuchsia-600/10" />
        <div className="absolute left-[20%] top-[-6rem] h-[20rem] w-[20rem] rounded-full bg-violet-400/15 blur-[110px] dark:bg-violet-600/10" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400">
            Analyze
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Upload your export
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Drop the ZIP you got from Instagram. It's read locally and never
            leaves your device.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {/* Main: dropzone */}
          <div className="lg:col-span-3">
            <Dropzone onFiles={handleFiles} loading={loading} />

            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Supported files + sample */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">We read:</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-medium dark:border-white/10 dark:bg-white/5">
                  <FileJson className="h-3.5 w-3.5 text-fuchsia-500" />{" "}
                  followers_1.json
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-medium dark:border-white/10 dark:bg-white/5">
                  <FileJson className="h-3.5 w-3.5 text-fuchsia-500" />{" "}
                  following.json
                </span>
              </div>
              <button
                type="button"
                onClick={handleSample}
                disabled={loading}
                className="btn-ghost self-start whitespace-nowrap !px-2.5 text-sm text-fuchsia-600 hover:bg-fuchsia-50 disabled:opacity-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-500/10"
              >
                <PlayCircle className="h-4 w-4" /> Try with sample data
              </button>
            </div>
          </div>

          {/* Sidebar: privacy + guide */}
          <aside className="space-y-6 lg:col-span-2">
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Why this is
                safe
              </p>
              <ul className="mt-4 space-y-4">
                {assurances.map((a) => {
                  const Icon = a.icon;
                  return (
                    <li key={a.title} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {a.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {a.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-5 text-white shadow-lg shadow-fuchsia-500/20">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
              <div className="relative">
                <p className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" /> Don't have your data yet?
                </p>
                <p className="mt-1.5 text-sm text-white/85">
                  Request your info from Instagram first — in JSON format. It
                  only takes a minute.
                </p>
                <Link
                  to="/guide"
                  className="btn mt-4 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Read the guide <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
