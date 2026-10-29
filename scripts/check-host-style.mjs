#!/usr/bin/env node
/**
 * 宿主样式契约校验（dsh-notify 独立仓库版本）。
 *
 * 插件不能 require 宿主的 client 包，所以通用设置行、Switch 这类外观只能从 DSH
 * 源码复制字面值。host-style.json 把这些复制值固化成可校验数据：宿主源码一改动，
 * 本检查立刻失败并指出缺哪一项，避免插件外观悄悄落后于 DSH。
 *
 * 用法：
 *   node scripts/check-host-style.mjs
 *   DSH_HOST_ROOT=/path/to/deepseek-harness node scripts/check-host-style.mjs
 *
 * scope=repo 相对本仓库根（插件包根）；scope=host 相对 DSH_HOST_ROOT
 * （默认 ./deepseek-harness）。宿主 checkout 缺失时 scope=host 条目跳过并提示，
 * scope=repo 条目仍然校验。退出码：有 error 时 1，否则 0。
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const HOST_ROOT = process.env.DSH_HOST_ROOT === undefined || process.env.DSH_HOST_ROOT === ''
  ? join(ROOT, 'deepseek-harness')
  : resolve(process.env.DSH_HOST_ROOT)
const MANIFEST = join(ROOT, 'host-style.json')
const rel = (path) => relative(ROOT, path).split(sep).join('/')

const problems = []
let verified = 0
let skipped = 0

if (!existsSync(MANIFEST)) {
  console.error('check-host-style: 找不到 host-style.json。')
  process.exit(1)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
} catch (error) {
  console.error(`check-host-style: host-style.json 解析失败：${error.message}`)
  process.exit(1)
}

const checks = Array.isArray(manifest.checks) ? manifest.checks : []
if (checks.length === 0) {
  console.error('check-host-style: checks 不能为空。')
  process.exit(1)
}

checks.forEach((check, index) => {
  const prefix = `host-style.json checks[${index}]`
  if (typeof check?.file !== 'string' || check.file === '') {
    problems.push(`${prefix}: 缺少 file`)
    return
  }
  const scope = check.scope === 'repo' ? 'repo' : 'host'
  const target = scope === 'repo' ? resolve(ROOT, check.file) : join(HOST_ROOT, check.file)
  if (!existsSync(target)) {
    if (check.required === true) problems.push(`${prefix}: 找不到 ${rel(target)}（required=true）`)
    else {
      skipped += 1
      console.log(`check-host-style: 跳过（未检出）${scope === 'repo' ? '' : '宿主文件 '}${rel(target)}`)
    }
    return
  }
  const text = readFileSync(target, 'utf8')
  const wanted = Array.isArray(check.contains) ? check.contains : []
  if (wanted.length === 0) {
    problems.push(`${prefix}: contains 不能为空`)
    return
  }
  const missing = wanted.filter((snippet) => typeof snippet !== 'string' || !text.includes(snippet))
  if (missing.length > 0) {
    problems.push(
      `${prefix}: ${rel(target)} 缺少 ${missing.map((snippet) => JSON.stringify(snippet)).join('、')}；`
      + '宿主样式已变化，请同步 client.js 与 host-style.json',
    )
  }
  verified += 1
})

if (problems.length > 0) {
  console.error('check-host-style: 发现宿主样式漂移：')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`check-host-style: ${verified} 项一致${skipped === 0 ? '' : `，${skipped} 项跳过`}。`)
