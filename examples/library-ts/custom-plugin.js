class SimpleStatusPlugin {
  constructor(name = 'SimpleStatusPlugin') {
    this.name = name
  }
  apply(compiler) {
    compiler.hooks.status.tap(this.name, (text) => {
      // 仅作为演示：输出状态文本
      console.log(`[status]: ${text}`)
    })
  }
}

module.exports = { SimpleStatusPlugin }
