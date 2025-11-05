class SimpleStatusPlugin {
  constructor(name = 'SimpleStatusPlugin') {
    this.name = name
  }
  apply(compiler) {
    compiler.hooks.status.tap(this.name, (payload) => {
      // 仅作为演示：输出状态文本
      // console.log(`[SimpleStatusPlugin]: ${payload.message}`)
      // console.log(payload)
    })
  }
}

module.exports = { SimpleStatusPlugin }
