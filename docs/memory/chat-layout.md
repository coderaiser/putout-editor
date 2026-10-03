# Chat layout and CI

Three things that were found on this branch, are now fixed, and are here so the cause is
not derived twice. What is still open is in [`../issues/chat.md`](../issues/chat.md).

## `width: 100%` with horizontal padding and no `box-sizing`

**There were three of them, and the plan named two.**

`.input` is `width: 100%` with `padding: 12px 20px 18px`. `.autocomplete` is
`position: absolute` with `left: 20px; right: 20px`. `.chat__thread` is `width: 100%` with
`padding: 24px 20px`. None declared `box-sizing`, so all three are `content-box` and each
added its own horizontal padding on top of the width.

Measured on `devices['iPhone 12']` (390×664) with the built bundle in `out/chat/`, through
`getBoundingClientRect()` and `document.documentElement.scrollWidth`:

| | before | after |
|---|---|---|
| `document.documentElement.scrollWidth` | 430 | 390 |
| `.input` right edge | 430 | 390 |
| `.input__send` right edge | 410 | 370 |
| `.chat__thread` right edge | 430 | 390 |
| `.autocomplete` left/right | 20 / 410 | 20 / 370 |

`scrollWidth: 430` on a 390px screen is the whole document scrolling sideways on every phone,
and `send.right: 410` is 20px of the send button off-screen and untappable.

**Fixing the two the plan named left `scrollWidth` at exactly 430.** The third selector
overflowed by exactly as much, and nothing failed except the test that measured the document.
The plan's grep found two because the plan was written before anything was measured. What
found the third in one pass was a probe over every element whose `right` edge is past the
viewport — and `wide: []` is what the same probe says now.

**The lesson is not "add `box-sizing`".** It is that *a count found by reading is a count
found by the thing that has already been measured*, and the thing that has already been
measured here is a browser. `.input__box` had declared `box-sizing` all along, for its own
`max-height`, which is exactly why three of its neighbours were wrong and it was not.

The shape is now a rule: `apply-box-sizing-to-sized-element` in `packages/plugin-putout-editor`.

**What was checked and deliberately left alone**, so nobody "fixes" it: the grown box caps at
`max-height: 200px` with `overflow-y: auto`, the dropdown does not overflow the top, and the
46×46 send button is a valid tap target. Measured all three.

## `packages/chat`'s e2e never ran in CI

`.github/workflows/e2e.yml` ran `redrun test:e2e` with `working-directory: packages/client`.
`redrun` collects scripts from the cwd and every **parent** — `parentDirectories` in
`redrun/bin/redrun.js` — never a sibling package. So it collected the root's `test:e2e` and
the client's, and `packages/chat`'s 18 specs were never collected.

**A green `E2E` badge was evidence about the editor and nothing else.** The name is what makes
it worth writing down: "run multiple npm-scripts fast" reads as *all of them*, and it is *all
of them on the way up*.

The fix is one step, and it is not another `redrun` invocation:

```yaml
      - name: Chat e2e
        run: bun run test:e2e
        working-directory: packages/chat
```

`bun run`, not `redrun`: `bun run` puts `node_modules/.bin` on `PATH` and `redrun` does not
reliably — the trap in [`workspaces.md`](./workspaces.md), which is the same one that broke
the e2e build in `89208bc`.

No build change was needed, and that was checked rather than assumed: the existing
`Build for e2e` step is `redrun build` from `packages/client`, which picks up the root's
`build`, and the root's `build` runs the client's and the chat's sequentially with absolute
paths. The chat bundle is already in `out/chat/` when the step runs.

**No `playwright install` was needed either** — the step above it already installs chromium
and webkit, and the browsers are cached on `~/.cache/ms-playwright` keyed by the
`playwright --version` the job resolves.

## A measurement taken right after `page.goto` reads an unmounted page

Written up in full in [`../issues/chat.md`](../issues/chat.md#a-playwright-measurement-taken-right-after-pagegoto-reads-an-unmounted-page),
because the fix is a `waitFor` that has to stay in the spec. The short version:
`page.goto` resolves on `load`, React mounts after it, and
`document.documentElement.scrollWidth` of an empty document **is** the viewport width — so a
geometry assertion taken immediately passes on a layout that is 40px too wide.