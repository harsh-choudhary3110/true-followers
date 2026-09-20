import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Seo from '../components/Seo';
import JsonLd from '../components/JsonLd';

const faqs = [
  {
    q: 'Is this safe? Do you see my data?',
    a: 'No. True Followers has no server that stores your data. Your export is read and compared entirely inside your browser. Nothing is uploaded, and we have no way to see who you follow.',
  },
  {
    q: 'Do I need to give you my Instagram password?',
    a: 'Never. Any tool that asks for your Instagram login is risky and against Instagram\'s terms. True Followers only uses the official data export you download from Instagram yourself.',
  },
  {
    q: 'Why do I have to download my data instead of just logging in?',
    a: 'Instagram\'s API does not let apps read your follower list, and scraping it violates their terms and can get your account restricted. Using your own official data export is the safe, compliant way to do this.',
  },
  {
    q: 'What format should I choose when exporting?',
    a: 'Either works — True Followers reads both JSON and HTML exports. JSON is recommended because it also includes the date each follow happened, so you can sort your lists by date. HTML gives you all the same usernames, just without dates.',
  },
  {
    q: 'How long does Instagram take to prepare my data?',
    a: 'For just followers and following it is often ready within a few minutes, but it can occasionally take a few hours. Instagram emails you a download link when it is ready.',
  },
  {
    q: 'Why don\'t I see profile pictures?',
    a: 'The Instagram export doesn\'t include profile photos, only usernames and links. Fetching real avatars would mean contacting Instagram\'s servers, which we avoid to keep the tool private and compliant. We show colored initials instead.',
  },
  {
    q: 'How does unfollower tracking work?',
    a: 'When you click "Save snapshot," we store your current follower list in your browser\'s local storage. Later, upload a fresh export and open the tracker to see who unfollowed you since that snapshot. This data stays on your device.',
  },
  {
    q: 'Is True Followers free?',
    a: 'Yes, completely free. There are no accounts, no sign-ups, and no limits — just upload your export and see your results.',
  },
  {
    q: 'Will using this get my Instagram account banned?',
    a: "No. True Followers never logs into Instagram or scrapes it — it only reads the official data export you download yourself. Nothing ever contacts Instagram on your behalf, so there's no risk to your account.",
  },
  {
    q: 'Does it work on iPhone and Android?',
    a: 'Yes. It runs in any modern browser on phone, tablet, or desktop. You can request your data export right inside the Instagram app, then upload the ZIP here.',
  },
  {
    q: 'Why is my follower count different from the Instagram app?',
    a: "Instagram's export can include accounts that have since deactivated or been deleted. These often stay in your following list but drop off your followers, so the numbers here may differ slightly from what the app shows. The comparison itself is still accurate to your export.",
  },
  {
    q: 'Where are my saved snapshots stored?',
    a: 'Snapshots are stored only in your browser (in IndexedDB) on this device — never uploaded anywhere. Use Export on the tracker page to back them up or move them to another device.',
  },
  {
    q: 'Can I export my lists to CSV?',
    a: 'Yes. Every list — non-followers, mutuals, and the rest — has a CSV button so you can download it as a spreadsheet.',
  },
  {
    q: 'Is True Followers affiliated with Instagram?',
    a: 'No. True Followers is an independent tool and is not affiliated with, endorsed by, or connected to Instagram or Meta.',
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden transition-colors">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900 dark:text-white">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180 text-fuchsia-500' : ''
          }`}
        />
      </button>
      {/* grid-rows 0fr -> 1fr animates height smoothly without a fixed pixel value */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-slate-600 dark:text-slate-300">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Seo
        title="FAQ — True Followers"
        description="Answers about privacy, Instagram data exports, JSON vs HTML, unfollower tracking, and how True Followers works — all in your browser, no login required."
        path="/faq"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Frequently asked questions
      </h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
        Everything about privacy, exports, and how True Followers works.
      </p>
      <div className="mt-8 space-y-3">
        {faqs.map((f) => (
          <Item key={f.q} {...f} />
        ))}
      </div>
    </div>
  );
}
