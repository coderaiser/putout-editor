## 🐊Putout Editor

Web editor for the simplest declarative plugins for 🐊[**Putout**](https://github.com/coderaiser/putout), pluggable code transformer of your dreams 🤫.

## Reasoning

🐊**Putout** wasn't invited to [parser's party](https://github.com/fkling/astexplorer/pull/414), so he made it's own party 🎉 with the most friendly and mainable **parsers**:
- ✅ [acorn](https://github.com/acornjs/acorn)
- ✅ [babel](https://babeljs.io/)
- ✅ [estree](https://github.com/eslint/espree)
- ✅ [esprima](https://github.com/jquery/esprima)

And ofcource 🐊[**Putout Runner**](https://github.com/coderaiser/putout/tree/master/packages/engine-runner#readme) with:

- ✅ [@putout/plugin-putout](https://github.com/coderaiser/putout/tree/master/packages/plugin-putout#readme)
- ✅ [@putout/convert-esm-to-commonjs](https://github.com/coderaiser/putout/tree/master/packages/plugin-convert-esm-to-commonjs#readme)
- ✅ [@putout/declare-undefined-variables](https://github.com/coderaiser/putout/tree/master/packages/plugin-declare-undefined-variables#readme)

enabled. For other then **JavaScript** languages and other transformations please use marvelous [astexplorer](https://astexplorer.net/).

## How to setup service

- generate token to create gist
- create file `/etc/systemd/system/putout-editor.service.d/overrids.conf` with:

```ini
[Service]
Environment=AUTH_TOKEN=your-github-token-with-acces-to-gist
```

## License

MIT
