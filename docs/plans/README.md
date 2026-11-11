# Plans

Planning documents. Each one is self-contained: a session with no prior context
should be able to open a single file and know what to do next.

| Plan | State | Last updated |
|---|---|---|
| [Technical SEO](./technical-seo-plan.md) | Verified, ready to start at Phase 0 | 11 Nov 2026 |
| [Notion reorganisation](./notion-reorganisation.md) | Ready to run, ~60–75 minutes | 11 Nov 2026 |
| [Roadmap and backlog](./roadmap.md) | Living document | 9 Nov 2026 |

## Convention

**One plan per file, named for the work rather than the date.** Dates live in
the file header, so renaming is never needed when a plan is revised.

**Every plan opens with a Handoff block** covering current state, the next
action, and what must not be started without approval. That block is what makes
a fresh session safe — without it, an agent will happily attempt open decisions.

**Progress lives in the plan.** Completed tasks are marked in place and phases
are logged in a Progress table at the end. Do not keep progress in a separate
document or in chat history.

**Plans are written from Build mode.** The Plan agent's write permission is
scoped to `~/.opencode/plan`, outside this repository, so it cannot create files
here. If a plan is drafted in Plan mode, move it into `docs/plans/` afterwards.

## Handing a plan to a new session

Start the session, point it at the absolute path of the plan, and state the
scope explicitly. Giving an agent a whole plan and no boundary is how phases get
mixed together and open decisions get resolved by guesswork.

```text
Read docs/plans/technical-seo-plan.md.

Implement Phase 0 only, from §4. Follow the acceptance criteria for each task.
Do not start tasks from any other phase.

Before editing, check that each file named in the tasks still matches its
description in the plan — the plan was verified on 11 Nov 2026.

When finished, run the checks in §5 and add a row to the Progress table.
```

For the SEO plan specifically, also read the **Deploy ordering** note in its
Handoff block before touching `astro.config.mjs`.
