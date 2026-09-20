import { useCallback, useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

interface Props {
  onFiles: (files: File[]) => void;
  loading: boolean;
}

export default function Dropzone({ onFiles, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (loading) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles, loading],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      role="button"
      aria-label="Upload your Instagram export"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !loading) inputRef.current?.click();
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
        dragging
          ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/10'
          : 'border-slate-300 bg-white hover:border-fuchsia-400 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-fuchsia-500/60'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.json,.html,application/zip,application/json,text/html"
        multiple
        aria-label="Instagram export file"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
      {loading ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-fuchsia-600" />
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">Analyzing your export…</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Everything happens right here in your browser.
          </p>
        </>
      ) : (
        <>
          <span className="icon-tile h-14 w-14 rounded-full">
            <FileUp className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">
            Drop your Instagram export ZIP here
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            or <span className="font-medium text-fuchsia-600">click to browse</span> · ZIP, JSON or HTML
          </p>
        </>
      )}
    </div>
  );
}
