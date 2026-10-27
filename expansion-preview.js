/* Módulo de expansión separado de la aplicación original. */
(function(){
"use strict";
const catalog=[
{id:"electronica-industrial",name:"Electrónica Industrial",kind:"electronica"},
{id:"mantenimiento-mecanico-i",name:"Mantenimiento Mecánico I",kind:"mantenimiento"},
{id:"electricidad-mantenimiento",name:"Electricidad de Mantenimiento",kind:"electricidad"},
{id:"mecanica-banco-ajuste",name:"Mecánica de Banco y Ajuste",kind:"banco"},
{id:"gestion-mantenimiento",name:"Gestión y Administración del Mantenimiento",kind:"gestion"},
{id:"mantenimiento-predictivo-tpm",name:"Mantenimiento Predictivo y TPM",kind:"predictivo"},
{id:"mantenimiento-preventivo",name:"Mantenimiento Preventivo",kind:"preventivo"},
{id:"hidraulica-parte-i",name:"Mantenimiento y reparación de equipos hidráulicos I",kind:"hidraulica1"},
{id:"hidraulica-parte-ii",name:"Mantenimiento y reparación de equipos hidráulicos II",kind:"hidraulica2"},
{id:"hidroneumatica-parte-i",name:"Mantenimiento de equipos hidráulicos y neumáticos I",kind:"hidroneumatica1"},
{id:"hidroneumatica-parte-ii",name:"Mantenimiento de equipos hidráulicos y neumáticos II",kind:"hidroneumatica2"},
{id:"mandos-hidraulicos",name:"Mandos de Máquinas Hidráulicas",kind:"mandoshidraulicos"},
{id:"mandos-electroneumaticos",name:"Mandos de Sistemas Electroneumáticos",kind:"electroneumatica"},
{id:"control-plc",name:"Sistema de Control con PLC",kind:"plc"}
];
const status=document.createElement("div");
status.id="expansionStatus";
status.style.cssText="padding:12px 16px;background:#eaf2ff;color:#184983;border:1px solid #adcafb;border-radius:10px;margin:10px 0;font-size:13px";
status.textContent="Ampliación documental: cargando catorce manuales adicionales…";
document.querySelector(".aside")?.prepend(status);
Promise.allSettled(catalog.map(async x=>{
const r=await fetch("./data/ampliados/"+x.id+".json",{cache:"no-cache"});
if(!r.ok)throw Error(x.name+" "+r.status);
const doc=await r.json();
if(!Array.isArray(doc.pages))throw Error("Formato inválido "+x.name);
DOC_LABEL[x.kind]=x.name;
LIBRARY[x.kind]={name:x.name,total:doc.total||doc.pages.length,pages:doc.pages};
let added=0;
const seen=new Set();
for(const pg of doc.pages){
if(!pg.t||pg.t.length<75||seen.has(pg.p))continue;
seen.add(pg.p);
const segments=pageSegments(x.kind,pg.p,pg.t);
for(const seg of segments){SEGMENTS.push(seg);added++}
}
return {name:x.name,pages:seen.size,fragments:added};
})).then(results=>{
const success=results.filter(r=>r.status==="fulfilled").map(r=>r.value);
const failed=results.length-success.length;
status.textContent=success.length+" manuales nuevos cargados para consulta: "+success.map(x=>x.name).join(", ")+(failed?" · "+failed+" pendientes":"")+". Vista previa: los nuevos documentos están indexados, pero la IA de Cloudflare aún requiere actualizar su lista de manuales. El aula principal no se modifica.";
const box=document.createElement("div");
box.style.cssText="font-size:12px;color:#365a87;margin-top:10px";
box.textContent="Fuentes añadidas: "+success.map(x=>x.pages+" págs. de "+x.name).join(" | ");
status.append(box);
});
})();