import { SwiftletOptions } from './types/index'
import swiftlet from './swiftlet'

export { defineConfig } from './defineConfig'

export * from './types'
export { default as LoadingPlugin } from './plugins/LoadingPlugin'
export { default as Compiler } from './Compiler'

export default swiftlet
