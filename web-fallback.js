/* Aula Técnica SENATI — consulta documental prioritaria + búsqueda externa complementaria.
   No se incluyen claves privadas ni credenciales en el navegador. */
(function () {
  'use strict';
  const MANUAL_FIRST_NOTE='Prioridad: manuales SENATI. La web se consulta si no hay respuesta suficiente.';
  let lastQuestion = '';
  let searching = false;
  let lastFallback = false;
  const API='https://es.wikipedia.org/w/api.php';
  const verifiedGuides=[
    {label:'Haas Automation · Manuales oficiales del fabricante',url:'https://www.haascnc.com/es/owners/Service/operators-manual.html'},
    {label:'OSHA · Protección de maquinaria',url:'https://www.osha.gov/machine-guarding'},
    {label:'Universidad Cornell · Seguridad de máquinas',url:'https://coop.ehs.cornell.edu/campus-health-safety/occupational-safety/tool-and-machine-safety'}
  ];
  const oldBubble=bubble;
  function addLink(el,item) {
    if(!item || !/^https:\/\//.test(item.url))return;
    const a=document.createElement('a');
    a.href=item.url;
    a.target='_blank';a.rel='noopener noreferrer';
    a.textContent=item.label+' ↗';
    a.style.cssText='display:inline-block;margin:8px 8px 0 0;background:#e6f0ff;border:1px solid #cadef6;color:#00499f;padding:9px 12px;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none';
    el.appendChild(a);
  }
  bubble=function(message,type,source){
    if(!source || source.type!=='external'){oldBubble(message,type,source);return}
    const el=document.createElement('div');el.className='bubble '+type;
    const p=document.createElement('div');p.textContent=message;el.appendChild(p);
    const footer=document.createElement('div');footer.className='source';
    const small=document.createElement('div');small.textContent='Fuentes externas (distintas de los manuales SENATI):';footer.appendChild(small);
    (source.links||[]).forEach(link=>addLink(footer,link));
    el.appendChild(footer);
    document.querySelector('#messages').appendChild(el);
    document.querySelector('#messages').scrollTop=document.querySelector('#messages').scrollHeight;
  };
  function renderAnswer(item){
    bubble(item.text,'bot',item.source);
    lastAnswer=item.text;
    if(document.querySelector('#autovoice').checked)speak(item.text);
  }
  function webSearchLinks(q){
    const ss=[
      {label:'Buscar en Haas Automation',domain:'haascnc.com'},
      {label:'Buscar en OSHA',domain:'osha.gov'},
      {label:'Buscar en Cornell',domain:'cornell.edu'}
    ];
    return ss.map(s=>({label:s.label,url:'https://www.google.com/search?q='+encodeURIComponent('site:'+s.domain+' '+q)}));
  }
  function wikiQuery(q){
    const useless=new Set('que como cual cuales para sirve cuales diferencia entre con sin las los del de por donde cuando porque realizar hacemos funciona proceso funcionamiento tipos cual cuanto quiero saber explicar explicacion conocer podemos puede mas cuales material torno fresadora rectificadora fresar torno mecanico'.split(' '));
    let words=ntext(q).split(/\s+/).filter(w=>w.length>2&&!useless.has(w));
    const tokens=[...new Set(words)];
    if(!tokens.length)tokens=[...new Set(ntext(q).split(/\s+/).filter(w=>w.length>3))];
    if(active==='torno'&&!tokens.includes('torno'))tokens.push('torno');
    if(active==='fresadora'&&!tokens.includes('fresadora'))tokens.push('fresadora');
    if(active==='rectificadora'&&!tokens.includes('rectificado'))tokens.push('rectificado');
    return tokens.slice(0,6).join(' ')||q.slice(0,90);
  }
  function wikipediaRelevance(page,q){
    const title=ntext(page.title||'');
    const text=ntext((page.extract||'').slice(0,1100));
    const general=new Set('que como cual cuales para sirve diferencia proceso funciona tener hacia desde tipos maquinas herramienta herramientas torno fresadora rectificadora mecanico maquina sistema material pieza piezas uso uso'.split(' '));
    const words=[...new Set(ntext(q).split(/\s+/).filter(w=>w.length>3&&!general.has(w)))];
    if(words.length===0)return title.length>0 ? 3 : 0;
    let titleHit=0,bodyHit=0;
    for(const w of words){
      const root=w.length>=7?w.slice(0,-2):w;
      if(title.includes(root))titleHit++;
      if(text.includes(root))bodyHit++;
    }
    if(titleHit>=1)return 5+titleHit*3+bodyHit;
    if(bodyHit>=Math.max(2,Math.ceil(words.length*.65)))return bodyHit;
    return 0;
  }
  async function fetchWikimedia(q){
    const params=new URLSearchParams({
      action:'query',generator:'search',gsrsearch:wikiQuery(q),gsrlimit:'5',
      prop:'extracts|info',inprop:'url',exintro:'1',explaintext:'1',exchars:'1150',
      redirects:'1',format:'json',formatversion:'2',origin:'*'
    });
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),9000);
    try{
      const res=await fetch(API+'?'+params.toString(),{signal:controller.signal,mode:'cors'});
      if(!res.ok)throw Error('HTTP '+res.status);
      const json=await res.json();
      let candidates=(json.query?.pages||[])
        .filter(x=>!x.missing&&x.extract&&x.extract.trim().length>=100)
        .map(p=>({...p,relevance:wikipediaRelevance(p,q)}))
        .filter(p=>p.relevance>=4)
        .sort((a,b)=>b.relevance-a.relevance);
      if(!candidates.length)return null;
      const p=candidates[0];
      let extract=p.extract.replace(/\s{2,}/g,' ').trim();
      extract=extract.split(/\n/).map(v=>v.trim()).filter(Boolean).slice(0,3).join(' ');
      const end=extract.slice(0,710);
      const endPoint=Math.max(end.lastIndexOf('. '),end.lastIndexOf('.'));
      if(extract.length>710 && endPoint>270)extract=end.slice(0,endPoint+1);
      else extract=end+(extract.length>710?'…':'');
      const url=p.fullurl||'https://es.wikipedia.org/wiki/'+encodeURIComponent(p.title.replace(/ /g,'_'));
      return {text:'Información complementaria encontrada en la web — '+p.title+':\n\n'+extract+'\n\nEsta fuente es una enciclopedia colaborativa, no un manual técnico certificado. Contrasta las indicaciones operativas con el instructor y los manuales de la máquina.',
        source:{type:'external',links:[{label:'Abrir artículo original · Wikipedia',url},...webSearchLinks(q)]}};
    }finally{clearTimeout(timer)}
  }
  async function searchOnWeb(q,{force=false}={}){
    if(searching)return;
    searching=true;
    const status=document.querySelector('#status');
    const btn=document.querySelector('#webSearchButton');
    if(btn)btn.disabled=true;
    const online=navigator.onLine;
    if(!online){
      const message='No hay conexión a internet. Los manuales descargados anteriormente pueden seguir consultándose. Para fuentes externas, conecta este dispositivo a internet.';
      bubble(message,'bot',{type:'external',links:verifiedGuides});
      status.textContent='Sin conexión. Consulta web no disponible.';
      if(document.querySelector('#autovoice').checked)speak(message);
      searching=false;if(btn)btn.disabled=false;
      return;
    }
    status.textContent='Consultando información complementaria en la web…';
    try{
      const result=await fetchWikimedia(q);
      if(result){
        renderAnswer(result);
        status.textContent='Respuesta web con enlace a la fuente. Contrasta la información técnica importante.';
      }else{
        const msg='No encontré una explicación web suficientemente relacionada y verificable de forma automática para esa pregunta. Puedes consultar estos recursos especializados y revisar sus resultados, o reformular la pregunta con el término técnico.';
        const links=[...webSearchLinks(q),...verifiedGuides.slice(0,2)];
        renderAnswer({text:msg,source:{type:'external',links}});
        status.textContent='No hubo resultados web suficientemente relevantes. Se muestran fuentes de consulta.';
      }
    }catch(err){
      const message='No se pudo consultar la fuente externa desde este navegador. La biblioteca SENATI sigue disponible. Puedes utilizar los siguientes enlaces para investigar en documentación de fabricantes y organismos de seguridad.';
      renderAnswer({text:message,source:{type:'external',links:[...webSearchLinks(q),...verifiedGuides.slice(0,2)]}});
      status.textContent='Búsqueda web no disponible: '+(err.name==='AbortError'?'la consulta superó el límite de espera':'el servicio no respondió')+'.';
    }finally{
      searching=false;if(btn)btn.disabled=false;
    }
  }
  ask=async function (s){
    const q=String(s||'').trim();if(!q)return;
    if(searching){document.querySelector('#status').textContent='Hay una consulta web en curso. Puedes seguir preguntando cuando termine.';return}
    lastQuestion=q;
    bubble(q,'user');document.querySelector('#question').value='';
    const manual=answer(q);
    if(manual.source&&manual.source.kind){
      renderAnswer(manual);
      document.querySelector('#status').textContent=MANUAL_FIRST_NOTE+' Puedes presionar «Ampliar en internet».';
      // Si se obtuvo únicamente texto literal con relación parcial, permite ampliarlo con fuentes web.
      if(!manual.trusted && navigator.onLine){
        await searchOnWeb(q);
      }
    }else{
      // El manual no respondió; si hay conexión se intenta una consulta externa sin inventar datos.
      if(navigator.onLine){
        await searchOnWeb(q);
      }else{
        renderAnswer({text:'No encontré esa respuesta en los manuales disponibles y no hay conexión para consultar fuentes externas. Puedes formular la pregunta de otro modo.',source:null});
        document.querySelector('#status').textContent='Disponible solo la biblioteca local mientras estés sin conexión.';
      }
    }
  };
  const bar=document.querySelector('.controls');
  if(bar){
    const right=bar.querySelector('div');
    if(right){
      const btn=document.createElement('button');
      btn.id='webSearchButton';btn.type='button';btn.className='smallbtn';
      btn.textContent='🌐 Ampliar en internet';
      btn.title='Consultar contenido complementario de la web, distinto de los manuales';
      btn.addEventListener('click',()=>{
        const q=lastQuestion||document.querySelector('#question').value.trim();
        if(!q){document.querySelector('#status').textContent='Escribe primero una pregunta para buscarla en internet.';return}
        searchOnWeb(q,{force:true});
      });
      right.appendChild(btn);
    }
  }
  const caption=document.createElement('p');
  caption.style.cssText='font-size:12px;color:#64748b;margin:9px 0 0;line-height:1.5';
  caption.textContent='Primero se consultan los manuales. Sin respuesta suficiente, se busca información pública en internet y se muestran sus enlaces. Wikipedia es colaborativa; las guías oficiales se ofrecen como contraste. Las preguntas enviadas a la web pueden ser procesadas por terceros.';
  const inputbar=document.querySelector('.inputbar');
  if(inputbar)inputbar.appendChild(caption);
})();
