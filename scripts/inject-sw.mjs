import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const root = new URL('../dist/', import.meta.url)
const rootPath = root.pathname

const indexPath = join(rootPath, 'index.html')
let html = await readFile(indexPath, 'utf8')
const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
const styleMatch = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/)
if (!scriptMatch || !styleMatch) throw new Error('Could not locate the built app assets for offline inlining')
const script = await readFile(join(rootPath, scriptMatch[1].slice(1)), 'utf8')
const style = await readFile(join(rootPath, styleMatch[1].slice(1)), 'utf8')
html = html
  .replace(scriptMatch[0], `<script type="module">${script}</script>`)
  .replace(styleMatch[0], `<style>${style}</style>`)
await writeFile(indexPath, html)

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = []
  for (const entry of entries) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) paths.push(...await walk(full))
    else if (!entry.name.endsWith('.map') && entry.name !== 'sw.js') paths.push(full)
  }
  return paths
}

const files = await walk(rootPath)
const assets = files.map((file) => `/${relative(rootPath, file).split(sep).join('/')}`)
if (!assets.includes('/index.html')) throw new Error('Build output is missing index.html')
const swPath = join(rootPath, 'sw.js')
const source = await readFile(swPath, 'utf8')
const version = `rsc-shell-${Date.now()}`
const injected = source
  .replace("const CACHE_VERSION = 'rsc-shell-v1'", `const CACHE_VERSION = '${version}'`)
  .replace('["__APP_ASSETS__"]', JSON.stringify(assets))
await writeFile(swPath, injected)
