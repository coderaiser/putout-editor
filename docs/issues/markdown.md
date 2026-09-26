# markdown findings

Status: ✅ resolved, ❌ open.

---

## ✅ `convert-js-to-ts` — a `js` fence holding TypeScript

Landed in `@putout/plugin-markdown@1.5.0`. Rule:
[`packages/plugin-markdown/lib/convert-js-to-ts`](https://github.com/coderaiser/putout/tree/master/packages/plugin-markdown/lib/convert-js-to-ts).

Verified: the shipped `get_example('markdown')` plugin rewrites its own fixture —
`codeblock('ts', 'const a: string[] = [];')` — while plain JavaScript stays `js`, and
`find_places` reports it. The `js`-fence-holding-TS gate is live.
