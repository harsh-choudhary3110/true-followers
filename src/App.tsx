import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import Home from './pages/Home';
import { useStore } from './store';

// Home stays eager (first paint); heavier routes are code-split.
const Guide = lazy(() => import('./pages/Guide'));
const Upload = lazy(() => import('./pages/Upload'));
const Results = lazy(() => import('./pages/Results'));
const Tracker = lazy(() => import('./pages/Tracker'));
const Faq = lazy(() => import('./pages/Faq'));
const Privacy = lazy(() => import('./pages/Privacy'));

function PageFallback() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
    </div>
  );
}

function RootLayout() {
  const dark = useStore((s) => s.theme) === 'dark';
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: dark ? '#14161f' : '#ffffff',
            color: dark ? '#f1f5f9' : '#0f172a',
            border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#ffffff' } },
        }}
      />

      {/* Vercel Web Analytics — cookieless, anonymous page-view counts */}
      <Analytics />
    </Layout>
  );
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'guide', element: <Guide /> },
      { path: 'upload', element: <Upload /> },
      { path: 'results', element: <Results /> },
      { path: 'tracker', element: <Tracker /> },
      { path: 'faq', element: <Faq /> },
      { path: 'privacy', element: <Privacy /> },
      { path: '*', element: <Home /> },
    ],
  },
];
