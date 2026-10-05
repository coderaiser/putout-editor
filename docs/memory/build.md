# Build

**The essence.** A fresh `bun i` broke `packages/client`'s build, and the cause was one import:
`@putout/operator-match-files` imported `@putout/processor-css` to get a css parser, and that
processor imports `stylelint` and `cosmiconfig`. `cosmiconfig` reaches `env-paths`, which calls
`os.homedir()` **at import time**, and `os` is `false` for the browser — so the module graph
died on load, before anything ran.

```sh
$ cd packages/client && bun run build
ERROR in ../../node_modules/cosmiconfig/dist/loaders.js 12:26-34
  x Module not found: Can't resolve 'crypto' in '.../node_modules/cosmiconfig/dist'
```

**An operator must not import a processor.** Fixed upstream in
`@putout/operator-match-files@12.12.0`: the css processor import is replaced by
`@putout/operator-css`, whose only dependency is `happy-style` (pure JS over `css-tree`). Bumping
that one transitive dependency took the build from **90 errors to a clean compile**.

The lesson generalises: an *operator* is loaded by every rule, so anything it reaches statically
lands in every consumer's bundle. That is why `IgnorePlugin` is the wrong tool — see
[`../issues/build.md`](../issues/build.md) for the three attempts that each compiled and then
broke the app.

## A `NetworkError` from a mocked fetch is a *matching* failure, not an interception one

Found while upgrading `msw` `^2.15.0` → `^3.0.2` with no code change: 57 of 1050
client tests failed with `ECONNREFUSED 127.0.0.1:80`, and `tsc` reported ten
`TS2353`s. Two unrelated v3 changes, and only one of them is in the type errors.

**The rename** is the easy half — `onUnhandledRequest` → `onUnhandledFrame`,
`UnhandledRequestStrategy` → `UnhandledFrameStrategy`, because the option now
covers WebSocket frames too and takes a callback
(`{onUnhandledFrame({frame, defaults}) { defaults.warn() }}`).

**The preflight** is the expensive half, and it is a general shape rather than an
msw fact. happy-dom's `fetch` treats every request as cross-origin — the page is
`about:blank`, the API is `http://localhost` — so it sends an **`OPTIONS`**
preflight first. msw routes that through the same interceptor, finds no handler
for it (every handler is a `http.get`), reports it unhandled, and lets it reach
the network. The preflight fails and the real request fails with it.

Three hypotheses were each measured and each wrong, and all three were about
*interception* — because the error was a network error and a network error reads
like "not intercepted":

| Hypothesis | Measurement | Verdict |
|---|---|---|
| `globalThis.fetch` is non-configurable, so msw bails | it **is** configurable | no |
| the interceptors never apply | `FetchInterceptor.apply()` returns, `globalThis.fetch !== before`, `http.request !== before` | no |
| happy-dom's `Request` is not the global, so `initiator instanceof Request` fails | the global `Request` constructs to itself | no |

What settled it was listening on msw's own emitter instead of guessing:

```ts
const seen = () => {};

server.events.on('request:start', seen);
server.events.on('request:match', seen);
server.events.on('request:unhandled', seen);
```

**`request:start` then `request:unhandled`** — interception was working the whole
time and the *handler* was what did not match. Measured both ways on the same
fixture: handlers only → `NetworkError`; plus one `http.options('*', …)` → the
parsed response.

**The lesson worth keeping.** A network error is evidence about the network
layer, not about the layer above it, and every hypothesis it invites is about
whether interception happened at all. The instrument that answers the question is
the library's own event stream, and it is one line to attach. The misleading
tail was `Invariant Violation: the server is already listening` — a consequence
of the first failure's cleanup, so the *second* error was a symptom and reading
it first would have sent the investigation to the wrong place.
