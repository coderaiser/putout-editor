## 🐊Putout Editor [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

[BuildStatusURL]: https://github.com/coderaiser/putout-editor/actions "Build Status"
[BuildStatusIMGURL]: https://github.com/coderaiser/putout-editor/workflows/Node%20CI/badge.svg
[CoverageURL]: https://coveralls.io/github/coderaiser/putout-editor?branch=master
[CoverageIMGURL]: https://coveralls.io/repos/coderaiser/putout-editor/badge.svg?branch=master&service=github

Web editor for the simplest declarative plugins for 🐊[**Putout**](https://github.com/coderaiser/putout), pluggable code transformer of your dreams 🤫.

📱When on mobile use [Mobile Putout Editor](https://github.com/putoutjs/mobile-putout-editor).

## Reasoning

🐊**Putout** wasn't invited to [parser's party](https://github.com/fkling/astexplorer/pull/414), so he made it's own party 🎉 with the most friendly and maintainable **parsers**:

- ✅ [acorn](https://github.com/acornjs/acorn)
- ✅ [babel](https://babeljs.io/)
- ✅ [estree](https://github.com/eslint/espree)
- ✅ [esprima](https://github.com/jquery/esprima)

And of course 🐊[**Putout Runner**](https://github.com/coderaiser/putout/tree/master/packages/engine-runner#readme) with:

- ✅ [@putout/plugin-putout](https://github.com/coderaiser/putout/tree/master/packages/plugin-putout#readme)
- ✅ [@putout/plugin-convert-esm-to-commonjs](https://github.com/coderaiser/putout/tree/master/packages/plugin-convert-esm-to-commonjs#readme)
- ✅ [@putout/plugin-declare](https://github.com/coderaiser/putout/tree/master/packages/plugin-declare#readme)

enabled. For other then **JavaScript** languages and other transformations please use marvelous [astexplorer](https://astexplorer.net/).

## The packages

| Package | What it is |
|---|---|
| [`packages/client`](./packages/client) | the editor itself |
| [`packages/chat`](./packages/chat) | `/chat` — a thread where a command runs 🐊**Putout** over the source you set, with the AST tree beside it |
| [`packages/commands`](./packages/commands) | the commands and the AST flattener, shared by the chat and the mcp |
| [`packages/mcp`](./packages/mcp) | an MCP server exposing 🐊**Putout** to an agent |
| [`packages/plugin-putout-editor`](./packages/plugin-putout-editor) | the lint rules that are about *this* codebase |

**A command is its first word** — `ast`, `source [source]`, `find [plugin]` — with
no sigil in front of it, and `help` prints what each one takes. See
[`packages/chat/README.md`](./packages/chat/README.md).

## How to setup service

- generate token to create gist
- create file `/etc/systemd/system/putout-editor.service.d/overrids.conf` with:

```ini
[Service]
Environment=AUTH_TOKEN=your-github-token-with-access-to-gist
```

## License

MIT
