export default function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500">
        Coming in a later phase. Navigation is ready for Phase 1.
      </p>
    </div>
  );
}
