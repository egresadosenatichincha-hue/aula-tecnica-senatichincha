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

 // El aula es de MECÁNICA DE MANTENIMIENTO, no un buscador geográfico.
 // "lima"/"limas" siempre significa herramienta de taller salvo contexto explícito contrario.
 const isFileTool=q=>/\blimas?\b/.test(clean(q))&&!/\b(ciudad|capital|departamento|provincia|francia|peru|geografia|turismo)\b/.test(clean(q));
 const noisePlaces=text=>clean(text).replace(/\blima\s+peru\b/g,' ');
 const subjectArea=q=>{
   const v=clean(q);
   if(isFileTool(q))return 'banco';
   if(/\b(neumatica|neumatico|electroneumatica|valvula neum[a-z]+|aire comprimido)\b/.test(v))return 'neumatica';
   if(/\b(afilado|filo|muela abrasiva)\b/.test(v))return 'afilado';
   if(/\b(soldadura|soldar|electrodo)\b/.test(v))return 'soldadura1';
   if(/\b(contactor|contactores)\b/.test(v))return 'contactores';
   if(/\b(plc|automata programable)\b/.test(v))return 'plc';
   return null;
 };
 function nearest(q){
   if(typeof SEGMENTS==='undefined'||!Array.isArray(SEGMENTS))return [];
   const tokens=words(q).map(w=>w==='limas'?'lima':w);
   if(!tokens.length)return [];
   const txt=clean(q);
   const contextual=subjectArea(q);
   const specific=active!=='all'?active:contextual||(/\b(torno|tornear|torneado|paralelo)\b/.test(txt)?'torno':/\b(fresadora|fresar|fresado)\b/.test(txt)?'fresadora':/\b(rectificadora|muela|rectificado)\b/.test(txt)?'rectificadora':null);
   const selected=[];
   for(const chunk of SEGMENTS){
      if(specific && chunk.kind!==specific)continue;
      const norm=noisePlaces(chunk.text);
      let matches=0,points=0;
      for(const w of tokens){
        const stem=w.length>6?w.slice(0,-2):w;
        if(norm.includes(w)){matches++;points+=3}
        else if(stem.length>=4&&norm.includes(stem)){matches++;points+=1.4}
      }
      if(!matches)continue;
      const coverage=matches/tokens.length;
      if(coverage<(tokens.length<=2?.5:.35))continue;
      let score=points*(.5+coverage);
      if(isFileTool(q)){
        if(/\b(?:limas|lima)\s+(?:es|son|herramienta)/.test(norm) ||
           /herramienta de acero templado/.test(norm))score+=20;
        if(chunk.p===27&&chunk.kind==='banco')score+=55;
        if(chunk.p===28&&chunk.kind==='banco')score+=15;
        if(chunk.kind!=='banco')score-=20;
      }
      if(/partes|componentes|elementos/.test(txt)&&/partes principales/.test(norm.slice(0,150)))score+=10;
      if(/seguridad|precaucion/.test(norm.slice(0,110))&&!/seguridad|riesgo|peligro/.test(txt))score-=7;
      if(score>2)selected.push({s:chunk,score});
   }
   selected.sort((a,b)=>b.score-a.score);
   const result=[],seen=new Set();
   for(const entry of selected){
      const chunk=entry.s,key=chunk.kind+':'+chunk.p;
      if(seen.has(key))continue;
      seen.add(key);
      result.push({kind:chunk.kind,p:chunk.p,text:chunk.text.slice(0,1450),score:entry.score});
      if(result.length>=5)break;
   }
   return result;
 }
 // Consulta siempre el manual de Banco y Ajuste para preguntas sobre limas.
 // Esto resuelve el caso aunque los 20 manuales tarden en cargar en el navegador.
 let fileBookPromise=null;
 async function manualFileEvidence(q){
   if(!isFileTool(q))return [];
   if(!fileBookPromise)fileBookPromise=fetch('./data/ampliados/mecanica-banco-ajuste.json',{cache:'force-cache'})
     .then(async response=>{
       if(!response.ok)throw Error('El manual de banco no está disponible');
       const data=await response.json();
       if(!Array.isArray(data.pages))throw Error('Manual de banco no válido');
       return data;
     }).catch(()=>null);
   const book=await fileBookPromise;
   if(!book)return [];
   const references=[27,28,29].map(p=>book.pages.find(page=>Number(page.p)===p))
    .filter(page=>page && typeof page.t==='string' && page.t.length>100);
   return references.map(page=>({kind:'banco',p:Number(page.p),text:page.t.slice(0,1500)}));
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
   const evidence=isFileTool(question)?await manualFileEvidence(question):nearest(question);
   const technicalQuestion=isFileTool(question)?question+' (consulta de mecánica de banco: herramienta de limado y ajuste de metales, NO una ubicación geográfica)':question;
   const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:technicalQuestion,selected:active,evidence}),cache:'no-store'});
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
