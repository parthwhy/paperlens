# Milestone v1.1 Roadmap

**3 phases** | **4 requirements mapped**

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Backend Async Pipeline | Decouple code generation from request lifecycle | ANIM-01, ANIM-02 | Returns 202 instantly, tracking state transitions in memory. |
| 2 | Frontend Progress & UI | Visualize background progress and allow retries | ANIM-03, ANIM-04 | User sees multi-stage progress; can click Retry on failure. |
| 3 | E2E Validation | Validate the end to end success rate and UX | All | Entire animation flow completes or fails safely without deadlocks. |

### Phase Details

**Phase 1: Backend Async Pipeline**
Goal: Restructure `POST /animate` to offload to a background task and implement fine-grained status tracking.
Requirements: ANIM-01, ANIM-02
Success criteria:
1. `POST /animate` responds instantly with a job ID.
2. `GET /animate/status/{id}` returns `planning`, `coding`, `rendering`, `ready`, or `failed`.

**Phase 2: Frontend Progress & Error UI**
Goal: Implement the UI to consume the new detailed statuses and recover from errors.
Requirements: ANIM-03, ANIM-04
Success criteria:
1. UI displays active component for `planning`, `coding`, `rendering`.
2. Failed component displays clear message + retry button.

**Phase 3: E2E Validation**
Goal: Final polish and testing of the pipeline manually.
Requirements: All
Success criteria:
1. Successfully generate an animation end-to-end.
2. Intentionally cause a syntax error, verify retry works.
