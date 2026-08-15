# 05 Preserve Modules

Demonstrates `preserveModules: true`, which keeps the `src/` directory structure in the output.

## Run

```bash
pnpm build
```

## Expected output

```
dist/
  esm/
    src/
      index.js
      utils.js
      nested/
        deep.js
  cjs/
    src/
      index.js
      utils.js
      nested/
        deep.js
```
