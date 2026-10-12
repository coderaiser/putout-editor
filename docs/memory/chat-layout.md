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
## The seeded thread, and the three things it broke

`packages/chat` no longer opens on an empty thread: it opens with a worked
`source` example (the `replacer` template from `packages/client`, copied for the
boundaries rule) and the help. Seeding it fixed "a user opened this and has no
idea what to type" and immediately broke three things, each of which is a lesson
rather than a fix.

**The whole document scrolled sideways on a phone.** `document.scrollWidth` was
514 on a 390px viewport, because the thread's content — a `white-space: pre` source
listing and a help table with a `nowrap` column — is wider than a phone and
neither could shrink. The fix is `min-width: 0` on **`.chat`**, and the part worth
keeping is *where*: the first attempt put it on `.chat__thread` and changed
nothing, because `.chat` is the grid item and a grid item defaults to
`min-width: auto`. A rule one level too deep is not weaker, it is absent.
`the composer fits the viewport width` was green for weeks and went red.

**A measurement that flags the right thing is not the same as one that flags
everything.** The "no element hangs off the right edge" probe reported thirteen
elements, all inside `.source-block`, which is `overflow-x: auto` **on purpose** —
a long line of code is supposed to be wider than a phone and to scroll in its own
box. The probe now walks ancestors and only reports what the page cannot scroll
to, which is the defect.

**Two viewport heights, and the difference is 18px.** `getBoundingClientRect()`
and `page.viewportSize()` disagree on `devices['iPhone 12']`, so a spec comparing
them fails at zero slack for a reason that has nothing to do with the layout. Both
numbers now come from inside the page.

**Coverage fell from 100% and nothing had broken.** `Message`'s `places` and
`transform` branches stopped being reached: they had been covered because `find`'s
answer used to be the *first* message in an otherwise empty thread. Adding a
message to the set moved what the number was measuring. Confirmed by stashing and
re-running rather than assuming. This is the "100% is a number about the set"
lesson arriving a second time, and the same shape as
[`coverage.md`](./coverage.md).

## A component with three specs and no call sites

`HelpBlock` — the help table — was built, fully covered, and never rendered.
`help` answered with `type: 'text'` and `Message` mapped every `text` to a
`TextBlock`, so the component had no route into the page at all.

Worth stating as a rule of thumb, because the coverage number actively hid it:
**coverage measures whether a line ran, not whether a user can reach it.** A
component imported by nothing has no spec that would notice, so its specs keep
passing forever. The check that catches this is not more unit tests — it is
`grep` for the component's name outside its own directory.

The same class of thing was true of the **autocomplete**: it opened on `/`,
because `/` used to be how a command started. With no sigil left, the honest
trigger is "is what has been typed so far the start of a command name", so `Input`
matches by prefix and closes on whitespace — a space ends the command word and
what follows is an argument.

## A hint that names a command which no longer parses

Removing the slash from the grammar left six user-facing strings behind: four
`No source. Use /source first.` (one in each of `ast`, `find`, `transform`,
`test-pattern` — i.e. every command reached *before* there is a source, which is
exactly when a user reads it), plus two empty-state hints in the chat.

`grep` for `source` finds the definition, and the call site is a different file in
a different package inside a **string**. A rename that changes what parses has to
be followed by a search for the old spelling in text, not only in identifiers.

## `align-spaces` aligns blank lines; it does not strip them

`putout/align-spaces` compares the whole file against `alignSpaces(text)`, which
makes each blank line carry **the same indentation as the line below it**. Reading
the message — "Keep whitespaces in blank lines" — as "remove whitespace from blank
lines" produces the opposite of what the rule wants, and the error is reported at
`1:1` with no line, so it is worth looking up rather than guessing at. The rule
text is in `node_modules/align-spaces/lib/align-spaces.js` and it is nineteen
lines.

## The placeholder's `inset` was transposed, and `.input__box` had no `position: relative`

`inset` is `top right bottom left`. The value was `12px 16px 12px 52px` — left
52px, right 16px. The intended values are left 16px (the text edge) and right 52px
(the send button's lane), so the two were swapped, and on a 390px phone a 52px
left inset pushed "/help — list every command" far enough from the edge to read as
centred.

The containing block for `position: absolute` walks up to the nearest positioned
ancestor. `.input__box` declared no `position`, so the containing block was
`.input` (the composer row, which is `position: relative`) and the `inset`
coordinates were measured from *its* padding box — shifting the placeholder up and
left of where the text cursor sits.

**Fix:** `position: relative` on `.input__box`, and `inset: 12px 52px 12px 16px`
with `display: flex; align-items: center` for the vertical centring. Four values
written out, because a two-value `inset` gives both sides the same number — the
shape of the original mistake.

**A pseudo-element's computed style is readable, so it can be asserted.** A
`::before` cannot be *located* — a locator matches real elements — but
`getComputedStyle(element, '::before')` returns its resolved values, and that is
the only way to pin the numbers the transposition lived in. The regression spec
in `e2e/desktop.ts` reads `top`/`right`/`bottom`/`left`/`display`/`alignItems` and
compares them, and against the old stylesheet it fails with exactly the swap:
`left: 52px, right: 16px, display: block, alignItems: normal`.

**Asserting the box's padding proves nothing about the pseudo-element's `inset`.**
`.input__box { padding: 12px 52px 12px 16px }` was *correct* throughout, and
`the textarea left padding matches the thread gutter` was green on the broken
build — the two are independent declarations. That is the same shape as a
`t.match(result, 'tok-keyword')` that only reads a class name: a check that reads
the right *kind* of thing from the wrong place passes either way.

