# Review Rubric

Each dimension is scored 1-5. Any dimension below its threshold fails evaluation.

| Dimension | Threshold | What it means |
|-----------|-----------|---------------|
| Scope Fidelity | 4 | Matches the agreed sprint contract and user-visible slice |
| Functionality | 4 | Works end-to-end, not just in code paths or mocks |
| Quality / Craft | 3 | Code and UX are coherent, maintainable, and non-fragile |
| Integration Safety | 4 | Respects contracts, decisions, and surrounding systems |

Add task-specific dimensions when needed:
- Browser / Journey Quality for `qa_profile: browser|hybrid`
- API Semantics for `qa_profile: api|hybrid`
- Data Correctness for storage or migration work
- Skill Correctness for skill implementation tasks (must match QSanguosha reference behavior)
- Game Rule Fidelity for engine tasks (must follow official Kingdom War rules)
