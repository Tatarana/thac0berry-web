// Fila de geração das ilustrações do The Forge (funções puras; ver
// scripts/forge-art-pending.mjs).

/** Todos os prompts de docs/forge-arte.md: `**nome.webp**` seguido do bloco de código. */
export function promptsOfDoc(doc) {
  const found = doc.matchAll(/^- \[[ x]\] \*\*([a-z0-9-]+)\.webp\*\*\s*\n\s*```\s*\n\s*(.+?)\s*\n\s*```/gms)
  return [...found].map((m) => ({ name: m[1], prompt: m[2] }))
}

// Raças do Livro do Jogador primeiro; Planescape e Ravenloft depois.
const raceOrder = ['human', 'elf', 'dwarf', 'half-elf', 'halfling', 'gnome']
const mainClasses = ['fighter', 'mage', 'cleric', 'thief', 'ranger', 'paladin', 'druid', 'bard']

function kind(name) {
  if (name.startsWith('combo-')) return 'combo'
  if (name.startsWith('weapons-')) return 'weapons'
  if (name.startsWith('race-')) return 'race'
  return name.startsWith('class-') ? 'class' : 'other'
}

/** Posição na fila: combinações (raças comuns e classes principais antes), armas, genéricas. */
function rank(name) {
  const type = kind(name)
  if (type === 'combo') {
    const body = name.slice('combo-'.length)
    const race = raceOrder.findIndex((r) => body.startsWith(`${r}-`))
    const cls = mainClasses.findIndex((c) => body.includes(`-${c}`))
    return [0, race < 0 ? raceOrder.length : race, cls < 0 ? mainClasses.length : cls]
  }
  return [type === 'weapons' ? 1 : 2, 0, 0]
}

/** O que falta, na ordem de geração. `done` tem os nomes que já têm imagem. */
export function pendingArt(prompts, done) {
  const order = (a, b) => {
    const [x, y] = [rank(a.name), rank(b.name)]
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || a.name.localeCompare(b.name)
  }
  return prompts
    .filter((item) => !done.has(item.name))
    .map((item) => ({ ...item, kind: kind(item.name), slot: `forge/${item.name}` }))
    .sort(order)
}

// JavaScript para a página do ChatGPT. O agente executa o texto como está.

/** Escreve o prompt na conversa nova e envia. */
export const sendScript = (prompt) =>
  `await (async()=>{const p=${JSON.stringify(prompt)};const find=()=>document.querySelector('.ProseMirror[contenteditable="true"]');for(let w=0;w<15&&!find();w++)await new Promise(r=>setTimeout(r,1000));const e=find();if(!e)return 'SEM_CAIXA';let ok=false;for(let t=0;t<3&&!ok;t++){e.focus();document.execCommand('selectAll');document.execCommand('delete');await new Promise(r=>setTimeout(r,500));document.execCommand('insertText',false,p);await new Promise(r=>setTimeout(r,2500));ok=e.innerText.trim()===p}if(!ok)return 'TEXTO_DIFERENTE: '+e.innerText.trim().length+' de '+p.length;const b=document.querySelector('form button[type="submit"]');if(!b)return 'SEM_BOTAO';b.click();return 'ENVIADO'})()`

/** Espera até 25 s: PRONTA (final e estável), FORMATO_ERRADO, LIMITE (recusa ou aviso) ou ESPERANDO. */
export const pollScript = (wide = false) =>
  `await (async()=>{const end=Date.now()+25000;const last=()=>[...document.querySelectorAll('[data-message-author-role="assistant"]')].pop()?.innerText??'';const img=()=>[...document.images].filter(i=>i.naturalWidth>400).pop();const bad=/limit|too many|try again|couldn.t|can.t|cannot|unable|violat|policy|something went wrong|limite|tente novamente|não (posso|consigo)/i;while(Date.now()<end){const i=img();const busy=()=>!!document.querySelector('[data-testid="stop-button"],button[aria-label*="Parar"],button[aria-label*="Stop"]');const stop=busy();if(!stop&&!i&&bad.test(last()))return {estado:'LIMITE',texto:last().slice(0,300)};if(!stop&&i){const s=i.src;await new Promise(r=>setTimeout(r,6000));const j=img();if(j&&j.src===s&&!busy()){const b=await (await fetch(s)).blob();if(b.size>1000000&&(j.naturalWidth>j.naturalHeight)!==${wide})return {estado:'FORMATO_ERRADO',w:j.naturalWidth,h:j.naturalHeight};if(b.size>1000000)return {estado:'PRONTA',bytes:b.size,w:j.naturalWidth,h:j.naturalHeight}}}await new Promise(r=>setTimeout(r,3000))}return {estado:'ESPERANDO'}})()`

/** Baixa a imagem com o nome do item, sem passar pelo menu do ChatGPT. */
export const downloadScript = (name) =>
  `await (async()=>{const i=[...document.images].filter(x=>x.naturalWidth>400).pop();if(!i)return 'SEM_IMAGEM';const b=await (await fetch(i.src)).blob();const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=${JSON.stringify(`${name}.png`)};document.body.append(a);a.click();a.remove();return b.size})()`
