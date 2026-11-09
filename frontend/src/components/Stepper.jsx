const STAGES = ["matched", "applied", "under_review", "approved"];

export default function Stepper({ status }) {
  // 'rejected' is shown as a distinct end-state, not a step on the happy path.
  if (status === "rejected") {
    return <p className="text-sm text-rust font-medium">Rejected — check the scheme portal for reapplication rules.</p>;
  }

  const currentIndex = STAGES.indexOf(status);
  const progressPct = (currentIndex / (STAGES.length - 1)) * 100;

  return (
    <div>
      <div className="h-1 rounded-full stepper-line mb-2" style={{ "--progress": `${progressPct}%` }} />
      <div className="flex justify-between text-xs text-ink/60">
        {STAGES.map((s, i) => (
          <span key={s} className={i <= currentIndex ? "text-ink font-medium" : ""}>
            {s.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
