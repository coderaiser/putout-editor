## 🐊Putout Editor

Web editor to create plugins for pluggable code transformer 🐊[`Putout`](https://github.com/coderaiser/putout).

## How to setup service

- generate token to create gist
- create directory `/etc/systemd/system/putout-editor.service.d/overrids.conf` with:

```
[Service]
Environment=AUTH_TOKEN=your-github-token-with-acces-to-gist
```

## License

MIT
