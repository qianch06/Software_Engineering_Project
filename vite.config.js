const fs = require('node:fs')
const path = require('node:path')
// HBuilderX supplies its compiler modules; no project npm install is required.
const compiler = process.env.UNI_CLI_CONTEXT || path.resolve(__dirname, '../../HBuilderX/plugins/uniapp-cli-vite')
const uni = require(path.join(compiler, 'node_modules/@dcloudio/vite-plugin-uni')).default
const esbuild = require(path.join(compiler, 'node_modules/esbuild'))
module.exports = {
  plugins: [uni(), {
    name: 'gravity-webview-compatibility',
    enforce: 'post',
    closeBundle() {
      if (process.env.NODE_ENV !== 'production' || !process.env.UNI_OUTPUT_DIR) return
      const dir = path.join(process.env.UNI_OUTPUT_DIR, 'static/game/js')
      if (!fs.existsSync(dir)) return
      for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
        const target = path.join(dir, file)
        fs.writeFileSync(target, esbuild.transformSync(fs.readFileSync(target, 'utf8'), { target: ['chrome61', 'safari13'], minify: true, legalComments: 'none' }).code)
      }
    }
  }]
}
