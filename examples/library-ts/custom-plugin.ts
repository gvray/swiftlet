import type { CompilerHooks, StatusPayload } from 'swiftlet'

export class SimpleStatusPlugin {
  name: string
  constructor(name = 'SimpleStatusPlugin') {
    this.name = name
  }
  apply(compiler: { hooks: CompilerHooks }) {
    compiler.hooks.status.tap(this.name, (payload: StatusPayload) => {
      // 仅作为演示：输出状态文本
      // console.log(`[SimpleStatusPlugin]: ${payload.message}`)
      // console.log(payload)
    })
  }
}

module.exports = { SimpleStatusPlugin }
