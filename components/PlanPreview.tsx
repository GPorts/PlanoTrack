import type { GeneratedPlan } from "@/lib/types";

export function PlanPreview({ plan }: { plan: GeneratedPlan }) {
  return (
    <section className="preview-panel">
      <div className="preview-head">
        <strong>{plan.title}</strong>
        <span>{formatDate(plan.examDate)}</span>
      </div>
      <div className="preview-body">
        <p className="muted">{plan.summary}</p>
        {plan.schedule.slice(0, 9).map((item, index) => (
          <article className="study-row" key={`${item.date}-${item.period}-${index}`}>
            <div>
              <strong>{item.period}</strong>
              <div className="muted">{formatDate(item.date)}</div>
            </div>
            <div>
              <strong>{item.subject}</strong>
              <div className="muted">{item.topic}</div>
            </div>
            <span className={`pill ${item.kind === "questoes" ? "pill-blue" : ""}`}>{item.kind}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!day) return value;
  return `${day}/${month}/${year}`;
}
