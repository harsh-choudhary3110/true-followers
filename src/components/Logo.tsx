// Single source of truth for the brand mark lives in public/logo.svg,
// so the navbar/footer logo and the browser favicon never drift apart.
const markUrl = `${import.meta.env.BASE_URL}logo.svg`;

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-display font-bold tracking-tight ${className}`}
    >
      <img src={markUrl} alt="" className="h-[27px] w-auto" />
      <span className="text-lg">
        True <span className="text-gradient">Followers</span>
      </span>
    </span>
  );
}
