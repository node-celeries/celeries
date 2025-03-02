import $ from 'kleur'
import { relative } from 'node:path'

const formats = {
  esm: '.mjs',
  cjs: '.cjs'
} as const

const tasks: Promise<void>[] = []

async function build(entry: string, format: 'cjs' | 'esm') {
  const output = await Bun.build({
    entrypoints: [entry],
    naming: '[dir]/[name]' + formats[format],
    outdir: 'dist',
    target: 'node',
    packages: 'external',
    format: format
  })
  output.logs.forEach(console.log)
  if (!output.success) {
    console.warn(`${$.red('🟡')} failed to build in ${format.toUpperCase()}`)
  }

  let last = ''
  for (const out of output.outputs) {
    const name_ = out.name ?? entry
    const path_ = relative(process.cwd(), out.path)
    const size_ = out.size + 'B'
    console.log($.green(`${$.green('✅')} Built ${$.blue(
      last === name_ ? ' '.repeat(Bun.stringWidth(last)) : name_
    )} -> ${$.blue(path_)} (${$.cyan(size_)})`))
    last = name_
  }
}

for (const format in formats) {
  tasks.push(build('src/index.ts', format as keyof typeof formats))
}

export default await Promise.all(tasks)
