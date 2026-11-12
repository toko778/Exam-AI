import fs from 'node:fs/promises'
import path from 'node:path'
const root = await fs.realpath(process.cwd())
const dist = path.resolve(root,'dist')
if(!dist.startsWith(root + path.sep) || path.basename(dist)!=='dist') throw new Error('Unsafe output directory')
const stat=await fs.lstat(dist).catch(()=>null)
if(stat?.isSymbolicLink()) throw new Error('Refusing linked output directory')
await fs.rm(dist,{recursive:true,force:true})
await fs.mkdir(dist,{recursive:true})
for(const file of ['index.html','styles.css','contact.js']) await fs.copyFile(path.join(root,file),path.join(dist,file))
await fs.cp(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true})
console.log('Static build ready: dist/')
