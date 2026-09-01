export type CourseSnapshot = {
  delivery: string;
  learnerDeadline: string;
  educatorReporting: string;
};

export type CourseField = keyof CourseSnapshot;

export type CourseChange = {
  field: CourseField;
  before: string;
  after: string;
};

export type AlertDecision = {
  alert: boolean;
  changes: CourseChange[];
  summary: string;
};

const labels: Record<CourseField, string> = {
  delivery: "Course delivery",
  learnerDeadline: "Learner deadline",
  educatorReporting: "Educator reporting",
};

function valueAfterLabel(page: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = page.match(new RegExp(`(?:^|\\n)#{0,6}\\s*${escaped}\\s*:?\\s*(?:\\n|$)([^\\n#]+)`, "i"));
  if (!match?.[1]) throw new Error(`The page needs a ${label} section`);
  return match[1].trim();
}

export function parseCourseSnapshot(page: string): CourseSnapshot {
  return {
    delivery: valueAfterLabel(page, labels.delivery),
    learnerDeadline: valueAfterLabel(page, labels.learnerDeadline),
    educatorReporting: valueAfterLabel(page, labels.educatorReporting),
  };
}

export function decideCourseAlert(
  previous: CourseSnapshot,
  current: CourseSnapshot,
): AlertDecision {
  const fields = Object.keys(labels) as CourseField[];
  const changes = fields
    .filter((field) => previous[field] !== current[field])
    .map((field) => ({ field, before: previous[field], after: current[field] }));

  return {
    alert: changes.length > 0,
    changes,
    summary: changes.length === 0
      ? "No learner-facing course facts changed."
      : `Alert educators: ${changes.map((change) => labels[change.field]).join(", ")} changed.`,
  };
}
