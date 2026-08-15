# 07 Custom Plugin

Demonstrates how to write a Swiftlet plugin that taps into compiler hooks (`run`, `compile`, `status`, `done`).

## Run

```bash
pnpm build
```

You should see log lines from `BuildInfoPlugin` interleaved with the default build output.
