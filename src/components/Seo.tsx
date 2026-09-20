import { Head } from 'vite-react-ssg';

// Set VITE_SITE_URL to your deployed domain (used for canonical + OG URLs).
export const SITE_URL = import.meta.env.VITE_SITE_URL ?? '';
const SITE_NAME = 'True Followers';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`;

interface Props {
  /** Full <title> for the page. */
  title: string;
  description: string;
  /** Path for canonical + og:url, e.g. "/guide". */
  path?: string;
  /** Absolute image URL for social cards. */
  image?: string;
  /** Keep the page out of search indexes (e.g. dynamic results). */
  noindex?: boolean;
}

export default function Seo({ title, description, path = '/', image = DEFAULT_IMAGE, noindex }: Props) {
  const url = `${SITE_URL}${path}`;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
