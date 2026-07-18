## 🐊Putout Editor [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

[BuildStatusURL]: https://github.com/coderaiser/putout/actions?query=workflow%3A%22Node+CI%22 "Build Status"
[BuildStatusIMGURL]: https://github.com/coderaiser/putout/workflows/Node%20CI/badge.svg
[CoverageURL]: https://coveralls.io/github/coderaiser/putout?branch=master
[CoverageIMGURL]: https://coveralls.io/repos/coderaiser/putout/badge.svg?branch=master&service=github

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
- ✅ [@putout/convert-esm-to-commonjs](https://github.com/coderaiser/putout/tree/master/packages/plugin-convert-esm-to-commonjs#readme)
- ✅ [@putout/declare-undefined-variables](https://github.com/coderaiser/putout/tree/master/packages/plugin-declare-undefined-variables#readme)

enabled. For other then **JavaScript** languages and other transformations please use marvelous [astexplorer](https://astexplorer.net/).

## How to setup service

- generate token to create gist
- create file `/etc/systemd/system/putout-editor.service.d/overrids.conf` with:

```ini
[Service]
Environment=AUTH_TOKEN=your-github-token-with-access-to-gist
```

## License

MIT
