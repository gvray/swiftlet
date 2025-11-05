class SimpleStatusPlugin {
  constructor(name = 'SimpleStatusPlugin') {
    this.name = name
  }
  apply(compiler) {
    compiler.hooks.status.tap(this.name, (text) => {
      // console.log(`[status]: ${text}`)
    })
  }
}

module.exports = { SimpleStatusPlugin }
