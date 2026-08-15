# 04 Code Splitting

Demonstrates `splitting: true`, which allows dynamic `import()` to produce separate shared chunks.

## Run

```bash
pnpm build
```

## Expected output

```
dist/
  esm/
    index.js
    _shared/
      heavy-xxx.js
  cjs/
    index.js
    _shared/
      heavy-xxx.js
```
