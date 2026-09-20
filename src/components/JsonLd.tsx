import { Head } from 'vite-react-ssg';

/** Injects a schema.org JSON-LD <script> for rich results / AI answer engines. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Head>
  );
}
