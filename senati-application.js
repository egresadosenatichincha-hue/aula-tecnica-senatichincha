/* Interfaz verificada SENATI — el contenido documental tiene prioridad. */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const resolver=window.SenatiResolver;
if(!resolver){return}
const originalBubble=bubble;
const originalAnswer=answer;
const SYNTH_SUPPORTED=('speechSynthesis' in window && typeof SpeechSynthesisUtterance!=='undefined');
let speakingId=0, utterance=null;
// Limpieza SOLO para la voz: el texto y las fuentes en pantalla no cambian.
function cleanSpeech(value){
  return String(value||'')
    .replace(/\x60{3}[\s\S]*?\x60{3}/g,' ')             // Bloques de código.
    .replace(/!\[([^\]]*)\]\((?:https?:\/\/|\/)[^)]+\)/g,'$1')
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|\/)[^)]+\)/g,'$1')
    .replace(/\bhttps?:\/\/\S+/gi,' ')
    .replace(/^\s{0,3}#{1,6}\s*/gm,'')                 // Encabezados.
    .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/gm,' ')       // Listas.
    .replace(/^\s*(?:\|?\s*:?-{3,}:?\s*\|?)+\s*$/gm,'')
    .replace(/(\d)\s*\*\s*(\d)/g,'$1 por $2')          // Multiplicación.
    .replace(/[*_~\x60#]+/g,'')                        // Nunca leer «asterisco».
    .replace(/[|]+/g,', ')
    .replace(/[\u2022\u25aa\u25cf\u25e6]/g,', ')
    .replace(/\p{Extended_Pictographic}/gu,'')        // Emojis.
    .replace(/\s*([,.;:!?])\s*/g,'$1 ')
    .replace(/\s+/g,' ')
    .trim();
}
// Una frase o intervención continua; textos largos se encadenan automáticamente.
function makeChunks(raw){
  const text=cleanSpeech(raw);
  if(!text)return [];
  if(text.length<=850)return [text];
  const sentences=text.match(/[^.!?;]+(?:[.!?;]+|$)/g)||[text];
  const chunks=[];
  let part='';
  for(const phrase of sentences){
    let sentence=phrase.trim();
    if(!sentence)continue;
    if(part && part.length+sentence.length+1>850){
      chunks.push(part.trim());
      part='';
    }
    while(sentence.length>850){
      let pivot=sentence.lastIndexOf(' ',850);
      if(pivot<320)pivot=850;
      const head=sentence.slice(0,pivot).trim();
      if(head)chunks.push(head);
      sentence=sentence.slice(pivot).trim();
    }
    if(sentence)part+=(part?' ':'')+sentence;
  }
  if(part.trim())chunks.push(part.trim());
  return chunks;
}
function speakingError(message){
 const status=$('#status');
 if(status)status.textContent=message;
}
function stopAllSpeech(){
 speakingId++;
 if(SYNTH_SUPPORTED){try{speechSynthesis.cancel()}catch(e){}}
 utterance=null;
}
speak=function(raw){
 if(!SYNTH_SUPPORTED){speakingError('La lectura de voz no está disponible en este navegador. Puedes leer la respuesta en pantalla.');return}
 stopAllSpeech();
 const job=++speakingId;
 const chunks=makeChunks(raw);
 if(!chunks.length)return;
 const voices=speechSynthesis.getVoices();
 const voice=voices.find(v=>/^es[-_](PE|ES|MX)/i.test(v.lang)&&v.localService)||
             voices.find(v=>/^es/i.test(v.lang)&&v.localService)||
             voices.find(v=>/^es/i.test(v.lang))||null;
 let current=0;
 const playNext=()=>{
  if(job!==speakingId || current>=chunks.length)return;
  const u=new SpeechSynthesisUtterance(chunks[current++]);
  if(voice){u.voice=voice;u.lang=voice.lang}else{u.lang='es-ES'}
  u.rate=1;u.pitch=1;u.volume=1;
  utterance=u;
  u.onend=()=>{if(job===speakingId)playNext()};
  u.onerror=e=>{if(job===speakingId && !['interrupted','canceled'].includes(e.error))speakingError('No fue posible escuchar el audio. Prueba tocar de nuevo «Escuchar respuesta» ('+(e.error||'error de voz')+').')};
  try{speechSynthesis.speak(u)}
  catch(e){speakingError('El navegador no pudo reproducir el audio: '+e.message)}
 };
 playNext();
};
bubble=function(message,type,source){
 originalBubble(message,type,source);
 if(type!=='bot')return;
 const current=$('#messages .bubble.bot:last-child');
 if(!current)return;
 const panel=document.createElement('div');
 panel.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:13px;align-items:center;';
 const listen=document.createElement('button');
 listen.className='smallbtn';listen.type='button';
 listen.textContent='🔊 Escuchar respuesta';
 listen.setAttribute('aria-label','Escuchar esta respuesta en voz alta');
 listen.onclick=()=>speak(message);
 panel.appendChild(listen);
 const stop=document.createElement('button');stop.className='smallbtn';stop.type='button';
 stop.textContent='■ Detener voz';stop.onclick=stopAllSpeech;panel.appendChild(stop);
 current.appendChild(panel);
};
function showAnswer(item,auto=true){
 const a=item&&item.text?item:{text:'No hay una respuesta sustentada disponible.',source:null};
 bubble(a.text,'bot',a.source);
 lastAnswer=a.text;
 if(auto && $('#autovoice')?.checked)speak(a.text);
}
function addNotice(){
 const info=document.createElement('div');
 info.id='senati-mode-notice';
 info.style.cssText='font-size:12px;line-height:1.45;margin:8px 0;color:#315579';
 info.textContent='Modo documental: los manuales tienen prioridad. Respuestas abiertas con IA requieren activar un servidor de IA. Cada respuesta ofrece reproducción manual por voz.';
 const area=$('.inputbar');
 if(area)area.appendChild(info);
}
function wikiAlternative(q){
 const out=document.createElement('div');
 out.className='bubble bot';
 const p=document.createElement('p');
 p.textContent='Para esta pregunta, la búsqueda documental no permite generar una respuesta técnica suficientemente sustentada. Puedes consultar páginas especializadas, pero los resultados no se presentan como respuestas verificadas automáticamente.';
 out.appendChild(p);
 const sources=[
 {label:'Haas · Manuales de operadores',url:'https://www.haascnc.com/es/owners/Service/operators-manual.html'},
 {label:'OSHA · Seguridad de maquinaria',url:'https://www.osha.gov/machine-guarding'},
 {label:'Buscar en documentación del fabricante',url:'https://www.google.com/search?q='+encodeURIComponent('site:haascnc.com '+q)},
 {label:'Buscar en manuales de mecanizado',url:'https://www.google.com/search?q='+encodeURIComponent('site:sandvik.coromant.com '+q)}
 ];
 for(const x of sources){
  const a=document.createElement('a');
  a.href=x.url;a.textContent=x.label+' ↗';a.target='_blank';a.rel='noopener noreferrer';
  a.style.cssText='display:inline-block;margin:8px 8px 0 0;padding:8px 11px;background:#eaf2ff;border-radius:9px;font-size:12px;color:#0647bc';
  out.appendChild(a);
 }
 $('#messages').append(out);
 $('#messages').scrollTop=$('#messages').scrollHeight;
}
function normalizeServerSource(src){
 if(!src)return null;
 if(src.kind && src.p)return {kind:src.kind,p:src.p};
 return null;
}
async function requestRealAI(q){
 const endpoint=window.SENATI_AI_ENDPOINT;
 if(typeof window.SENATI_REQUEST_AI==='function')return await window.SENATI_REQUEST_AI(q);
 if(!endpoint||!/^https:\/\//.test(endpoint))return null;
 const response=await fetch(endpoint,{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({question:q,selected:active}),cache:'no-store'
 });
 if(!response.ok)throw new Error('HTTP '+response.status);
 const data=await response.json();
 if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('El servidor no devolvió una respuesta');
 const item={text:data.answer.trim(),source:normalizeServerSource(data.manual_source)};
 if(Array.isArray(data.web_sources))item.webSources=data.web_sources.filter(v=>v&&/^https:\/\//.test(v.url||'')).slice(0,4);
 return item;
}
let querying=false;
ask=async function(raw){
 const q=String(raw||'').trim();
 if(!q)return;
 if(querying){$('#status').textContent='Se está procesando una consulta. Espera a que finalice para realizar otra.';return}
 querying=true;
 bubble(q,'user');$('#question').value='';
 const curated=resolver.matching(q,active);
 try{
  if(curated){
   showAnswer(curated);
   $('#status').textContent='Respuesta validada con el manual SENATI. Puedes tocar «Escuchar respuesta».';
   return;
  }
  const endpoint=window.SENATI_AI_ENDPOINT;
  if(endpoint){
   $('#status').textContent='Analizando la pregunta con el motor de IA y los manuales…';
   try{
    const ai=await requestRealAI(q);
    if(ai){
      showAnswer(ai);
      if(ai.webSources?.length){
       const wrapper=$('#messages .bubble.bot:last-child');
       for(const item of ai.webSources){
        const link=document.createElement('a');link.href=item.url;link.textContent=(item.title||'Fuente web')+' ↗';link.target='_blank';link.rel='noopener noreferrer';link.style.cssText='margin-right:12px;font-size:12px;color:#0647bc';wrapper.append(link);
       }
      }
      $('#status').textContent='Consulta procesada; fuentes indicadas en la respuesta.';
      return;
    }
   }catch(error){$('#status').textContent='Motor de IA no disponible; consultando la biblioteca local.'}
  }
  const old=originalAnswer(q);
  const answerResult=resolver.answer(q,active,null);
  showAnswer(answerResult);
  $('#status').textContent=answerResult.source?.kind?'Fuente manual disponible. La explicación automática es documental, no IA generativa.':'Consulta no sustentada: se requiere un motor de IA conectado al servidor.';
 }finally{querying=false}
};
// Los controles existentes llaman a speak y ask en el momento de la interacción.
$('#repeat')?.addEventListener('click',()=>{if(lastAnswer)speak(lastAnswer)});
$('#stop')?.addEventListener('click',stopAllSpeech);
const webButton=$('#webSearchButton');
if(webButton)webButton.remove();
const consult=document.createElement('button');
consult.className='smallbtn';consult.type='button';consult.textContent='🌐 Consultar fuentes externas';
consult.onclick=()=>{
 const q=$('#question')?.value?.trim()||'máquinas herramientas';
 wikiAlternative(q);
};
$('.controls > div')?.append(consult);
addNotice();
})();
