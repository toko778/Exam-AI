import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const html=fs.readFileSync('index.html','utf8'), css=fs.readFileSync('styles.css','utf8')
const profile=JSON.parse(fs.readFileSync('profile.json','utf8'))
const checks=[]
const check=(name,passed)=>checks.push({name,passed:!!passed})
check('Georgian document language',/<html\s+lang="ka"/.test(html))
check('Responsive viewport',/name="viewport"/.test(html))
check('One main heading',(html.match(/<h1\b/g)||[]).length===1)
check('No unresolved template tokens',!/\{\{[A-Z_]+\}\}/.test(html))
check('Keyboard focus and reduced motion',css.includes(':focus-visible')&&css.includes('prefers-reduced-motion'))
check('Long contact values can wrap',css.includes('overflow-wrap: anywhere'))
check('Personal email supplied',!!profile.email)
check('Personal phone supplied',!!profile.phone)
check('Personal social links supplied',profile.socials?.length>0)
const missing=[]
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 const target=match[1]
 if(target.startsWith('#')||/^[a-z]+:/i.test(target))continue
 if(!fs.existsSync(path.resolve(target)))missing.push(target)
}
for(const match of css.matchAll(/url\("([^"]+)"\)/g))if(!fs.existsSync(path.resolve(match[1])))missing.push(match[1])
check('All local page assets exist',missing.length===0)
const luminance = hex => {const c=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const pairs=[['main text','#182d45','#f7f4ee'],['muted text','#5e6b78','#f7f4ee'],['small kicker','#795923','#f7f4ee'],['button','#ffffff','#182d45'],['figure caption','#49586a','#eee7db']]
const contrasts=pairs.map(([name,text,background])=>({name,text,background,ratio:Number(contrast(text,background).toFixed(2))}))
check('Specified normal-text colour pairs meet 4.5:1',contrasts.every(p=>p.ratio>=4.5))
const result={checkedAt:new Date().toISOString(),checks,missingAssets:missing,contrasts,pageSha256:crypto.createHash('sha256').update(html).digest('hex'),scope:'Static source and palette checks only; real browser checks are recorded separately.'}
fs.mkdirSync('evidence/checks',{recursive:true})
fs.writeFileSync('evidence/checks/static-check.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({passed:checks.filter(x=>x.passed).length,total:checks.length,failed:checks.filter(x=>!x.passed).map(x=>x.name),contrasts},null,2))
if(checks.some(x=>!x.passed))process.exit(1)
