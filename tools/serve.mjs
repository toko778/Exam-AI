import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
const root = process.cwd()
const port = Number(process.env.PORT || 5180)
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'}
const server = http.createServer(async (req,res) => {
 try {
  const url = new URL(req.url,'http://127.0.0.1')
  const pathname = decodeURIComponent(url.pathname)
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1)
  const allowed = ['index.html','styles.css','contact.js'].includes(relative) || relative.startsWith('assets/') || /^evidence\/code\/0[12]-[\w-]+\.html$/.test(relative)
  const file = path.resolve(root,relative)
  if(!allowed || !file.startsWith(root + path.sep)) { res.writeHead(404);res.end('Not found');return }
  const bytes = await fs.readFile(file)
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})
  res.end(bytes)
 } catch {res.writeHead(404);res.end('Not found')}
})
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port))
