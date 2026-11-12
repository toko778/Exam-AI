import fs from 'node:fs/promises'
import path from 'node:path'
const root = process.cwd()
const request = JSON.parse(await fs.readFile('prompts/02-groq-request.json', 'utf8'))
process.stdout.write('Ready for secret JSON on stdin (input is hidden).\n')
if (process.stdin.isTTY) process.stdin.setRawMode(true)
process.stdin.setEncoding('utf8')
const supplied = await new Promise((resolve, reject) => {
  let input = ''
  process.stdin.on('data', chunk => {
    input += chunk
    if (input.includes('\u0003')) return reject(new Error('Cancelled'))
    if (input.includes('\n') || input.includes('\r')) {
      process.stdin.pause()
      try { resolve(JSON.parse(input.trim())) } catch { reject(new Error('Invalid secret input')) }
    }
  })
})
if (process.stdin.isTTY) process.stdin.setRawMode(false)
const key = supplied.key
if (typeof key !== 'string' || !key.startsWith('gsk_')) throw new Error('Groq credential missing')
const started = Date.now()
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60000),
  headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
  body: JSON.stringify(request),
})
if (!response.ok) throw new Error('Groq returned HTTP ' + response.status)
const raw = await response.json()
const answer = JSON.parse(raw.choices?.[0]?.message?.content || 'null')
if (!answer || typeof answer.html !== 'string' || typeof answer.css !== 'string' || answer.icons?.length !== 3) throw new Error('Incomplete Groq proposal')
if (/<script|<iframe|<object|\bon[a-z]+\s*=/i.test(answer.html)) throw new Error('Unsafe HTML proposal')
await fs.mkdir('evidence/groq', { recursive: true })
await fs.mkdir('assets/icons', { recursive: true })
for (const icon of answer.icons) {
  if (!['email.svg','phone.svg','arrow.svg'].includes(icon.filename)) throw new Error('Unexpected icon name')
  if (!/^<svg[\s>]/i.test(icon.svg) || /<script|<foreignObject|<image|<use|\bon[a-z]+\s*=|href\s*=|javascript:/i.test(icon.svg)) throw new Error('Unsafe SVG proposal')
  await fs.writeFile(path.join('assets/icons', icon.filename), icon.svg + '\n')
}
const evidence = { checkedAt: new Date().toISOString(), tool: 'Groq API', requestedModel: request.model, returnedModel: raw.model, requestId: raw.id, elapsedMs: Date.now() - started, usage: raw.usage, proposal: answer }
await fs.writeFile('evidence/groq/02-response.json', JSON.stringify(evidence, null, 2) + '\n')
const bundled = answer.html.replace(/<link\b[^>]*href=["']styles\.css["'][^>]*>/i, '<style>\n' + answer.css + '\n</style>')
await fs.writeFile('evidence/code/02-groq-draft.html', bundled + '\n')
console.log(JSON.stringify({ success: true, model: raw.model, requestId: raw.id, usage: raw.usage, iconFiles: answer.icons.map(x => x.filename), evidence: 'evidence/groq/02-response.json' }))
