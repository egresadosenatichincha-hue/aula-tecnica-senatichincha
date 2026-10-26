/* Conector de Aula Técnica a Cloudflare Workers AI.
   Mantiene la búsqueda local de los manuales y envía solo evidencias
   al servidor cuando el usuario activa un servidor propio. */
(function(){
 'use strict';
 const STORE='senati_ai_worker_endpoint_v1';
 const $=s=>document.querySelector(s);
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const stop=new Set('cuales cual cuantos cuantas cual es de del los las un una uno y que para como donde porque puede son tiene hacer hace sobre entre esto este partes principales mecanico horizontal maquina herramienta necesito explicar dame por favor'.split(' '));
 function words(s){return [...new Set(clean(s).split(/\s+/).filter(w=>w.length>=3&&!stop.has(w)))]}
 function nearest(q){
   if(typeof SEGMENTS==='undefined'||!Array.isArray(SEGMENTS))return [];
   const tokens=words(q);
   if(!tokens.length)return [];
   const txt=clean(q);
   const specific=active!=='all'?active:/\b(torno|tornear|torneado|paralelo)\b/.test(txt)?'torno':/\b(fresadora|fresar|fresado)\b/.test(txt)?'fresadora':/\b(rectificadora|muela|rectificado)\b/.test(txt)?'rectificadora':null;
   const selected=[];
   for(const s of SEGMENTS){
      if(specific&&s.kind!==specific)continue;
      let matches=0,points=0;
      for(const w of tokens){
        const stem=w.length>6?w.slice(0,-2):w;
        if(s.norm.includes(w)){matches++;points+=3}
        else if(stem.length>=4&&s.norm.includes(stem)){matches++;points+=1.4}
      }
      if(!matches)continue;
      const coverage=matches/tokens.length;
      if(coverage<(tokens.length<=2?.5:.35))continue;
      let score=points*(0.5+coverage);
      if(/partes|componentes|elementos/.test(txt)&&/partes principales/.test(clean(s.text.slice(0,150))))score+=10;
      if(/seguridad|precaucion/.test(clean(s.text.slice(0,110)))&&!/seguridad|riesgo|peligro/.test(txt))score-=7;
      if(score>2)selected.push({s,score});
   }
   selected.sort((a,b)=>b.score-a.score);
   const result=[],seen=new Set();
   for(const entry of selected){
      const s=entry.s, key=s.kind+':'+s.p;
      if(seen.has(key))continue;
      seen.add(key);
      result.push({kind:s.kind,p:s.p,text:s.text.slice(0,1350),score:entry.score});
      if(result.length>=4)break;
   }
   return result;
 }
 function validEndpoint(url){
   try{const p=new URL(url);return p.protocol==='https:'&&/\.workers\.dev$|\.cloudflare\.workers\.dev$|\.pages\.dev$/.test(p.hostname)}catch{return false}
 }
 let url='https://senati-aula-ia.egresadosenatichincha.workers.dev';
 if(validEndpoint(url)){window.SENATI_AI_ENDPOINT=url.replace(/\/$/,'')+'/ask'}
 // Se ejecuta después del código de interfaz. Sobrescribe la función
 // de solicitud del backend sin compartir ninguna clave privada.
 window.SENATI_REQUEST_AI=async function(question){
   const endpoint=window.SENATI_AI_ENDPOINT;
   if(!endpoint)return null;
   const evidence=nearest(question);
   const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,selected:active,evidence}),cache:'no-store'});
   const data=await res.json().catch(()=>({error:'Respuesta del servidor no válida'}));
   if(!res.ok)throw Error(data.error||'Servidor no disponible');
   return {text:data.answer,source:data.manual_source||null,webSources:data.web_sources||[],sources:data.sources||[],mode:data.mode};
 };
 const select=document.createElement('div');
 select.style.cssText='margin-top:10px;font-size:12px;color:#38516d;line-height:1.55';
 const status=document.createElement('span');
 const has=true;
 status.textContent='IA en la nube: conectada automáticamente a SENATI.';
 select.append(status);
 $('.inputbar')?.append(select);
})();
