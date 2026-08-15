# 06 React Component Library

Demonstrates a real-world library setup: JSX/TSX, external peer dependencies, and globals mapping for UMD/IIFE.

## Run

```bash
pnpm install
pnpm build
```

## Expected output

```
dist/
  esm/
    index.js
  cjs/
    index.js
  index.d.ts
```

`react` is treated as external and is not bundled.
