import assert from "node:assert/strict";
import test from "node:test";
import { decideCourseAlert, parseCourseSnapshot } from "../src/course_change_monitor.js";

test("alerts when a learner deadline moves and leaves other facts unchanged", () => {
  const previous = {
    delivery: "Live seminar on Tuesdays",
    learnerDeadline: "Submit by 17 October",
    educatorReporting: "Weekly completion digest",
  };
  const current = parseCourseSnapshot(`
## Course delivery
Live seminar on Tuesdays
## Learner deadline
Submit by 24 October
## Educator reporting
Weekly completion digest
`);

  assert.deepEqual(decideCourseAlert(previous, current), {
    alert: true,
    changes: [{
      field: "learnerDeadline",
      before: "Submit by 17 October",
      after: "Submit by 24 October",
    }],
    summary: "Alert educators: Learner deadline changed.",
  });
});
