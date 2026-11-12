import fs from 'node:fs/promises'
const profile = JSON.parse(await fs.readFile('profile.json','utf8'))
const template = await fs.readFile('templates/index.html','utf8')
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
if (!profile.name?.trim()) throw new Error('Display name required')
const name = esc(profile.name.trim())
const initials = esc(profile.name.trim().split(/\s+/).slice(0,2).map(part=>[...part][0]).join(''))
const email = profile.email?.trim()
if (email && !/^[^\s@<>"'&]+@[^\s@<>"'&]+\.[^\s@<>"'&]+$/.test(email)) throw new Error('Invalid email address')
const phone = profile.phone?.trim()
const dial = phone?.replace(/[^\d+]/g,'')
if (phone && !/^\+?\d{6,15}$/.test(dial)) throw new Error('Invalid phone number')
const emailValue = email ? '<a class="contact-value" href="mailto:'+encodeURIComponent(email).replace(/%40/gi,'@')+'">'+esc(email)+'</a>' : '<p class="contact-value pending">ელფოსტა დასამატებელია</p>'
const phoneValue = phone ? '<a class="contact-value" href="tel:'+dial+'">'+esc(phone)+'</a>' : '<p class="contact-value pending">ტელეფონი დასამატებელია</p>'
const emailAction = email ? '<a class="button-primary" href="mailto:'+encodeURIComponent(email).replace(/%40/gi,'@')+'">მომწერე<img src="assets/icons/arrow.svg" alt="" width="20" height="20"></a>' : ''
const copyButton = email ? '<button class="button-secondary" type="button" data-copy-email="'+esc(email)+'">მისამართის კოპირება</button>' : ''
const socials = (profile.socials || []).map(item=>{
 const url = new URL(item.url)
 if(url.protocol !== 'https:' || url.username || url.password || !item.label?.trim()) throw new Error('Social link must be a labelled HTTPS URL')
 return '<a class="social-link" href="'+esc(url.href)+'" target="_blank" rel="noopener noreferrer">'+esc(item.label.trim())+'<img src="assets/icons/arrow.svg" alt="" width="17" height="17"><span class="sr-only"> — გაიხსნება ახალ ჩანართში</span></a>'
})
const socialLinks = socials.length ? '<nav class="social-links" aria-label="სოციალური ბმულები">'+socials.join('')+'</nav>' : '<p class="pending">სოციალური ბმულები დასამატებელია</p>'
const values = {NAME:name,INITIALS:initials,EMAIL_VALUE:emailValue,PHONE_VALUE:phoneValue,EMAIL_ACTION:emailAction,COPY_BUTTON:copyButton,SOCIAL_LINKS:socialLinks}
const output = template.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{ if(!(key in values))throw new Error('Unknown template token'); return values[key] })
await fs.writeFile('index.html',output)
console.log(JSON.stringify({page:'index.html',hasEmail:!!email,hasPhone:!!phone,socialLinkCount:socials.length,ready:!!email&&!!phone&&socials.length>0}))
