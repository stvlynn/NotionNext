const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const ts = require('typescript')

const sourcePath = path.join(__dirname, 'buildEnv.ts')
const source = fs.readFileSync(sourcePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019
  },
  fileName: sourcePath
})

const compiled = new Module(sourcePath, module)
compiled.filename = sourcePath
compiled.paths = Module._nodeModulePaths(__dirname)
compiled._compile(outputText, sourcePath)

module.exports = compiled.exports
