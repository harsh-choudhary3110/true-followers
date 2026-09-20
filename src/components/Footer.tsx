import { Link } from 'react-router-dom';
import { Github, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#080a12]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Compare your Instagram followers and following privately. Your data is processed
              entirely in your browser and never uploaded.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> 100% client-side · No login · No tracking
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Product</h3>
              <ul className="mt-3 space-y-2 text-slate-500 dark:text-slate-400">
                <li><Link to="/upload" className="hover:text-fuchsia-600">Upload export</Link></li>
                <li><Link to="/guide" className="hover:text-fuchsia-600">How it works</Link></li>
                <li><Link to="/tracker" className="hover:text-fuchsia-600">Unfollower tracker</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Support</h3>
              <ul className="mt-3 space-y-2 text-slate-500 dark:text-slate-400">
                <li><Link to="/faq" className="hover:text-fuchsia-600">FAQ</Link></li>
                <li><Link to="/privacy" className="hover:text-fuchsia-600">Privacy</Link></li>
                <li>
                  <a
                    href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-fuchsia-600"
                  >
                    Request your data
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row dark:border-white/[0.08]">
          <p>© {new Date().getFullYear()} True Followers. Not affiliated with Instagram or Meta.</p>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 hover:text-fuchsia-600"
            aria-label="Source code"
          >
            <Github className="h-4 w-4" /> Open source
          </a>
        </div>
      </div>
    </footer>
  );
}
