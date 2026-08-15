# 03 Multi Entry Library

Demonstrates how multiple named entries are emitted as separate files instead of being merged into a single bundle.

## Run

```bash
pnpm build
```

## Expected output

```
dist/
  esm/
    index.js
    cli.js
    utils.js
  cjs/
    index.js
    cli.js
    utils.js
```
