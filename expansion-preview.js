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
{id:"control-plc",name:"Sistema de Control con PLC",kind:"plc"},
{id:"soldadura-mantenimiento-i",name:"Soldadura de Mantenimiento I",kind:"soldadura1"},
{id:"afilado-manual",name:"Afilado Manual de Herramientas de Corte",kind:"afilado"},
{id:"soldadura-mantenimiento-ii",name:"Soldadura de Mantenimiento II",kind:"soldadura2"},
{id:"soldadura-mantenimiento-iii",name:"Soldadura de Mantenimiento III",kind:"soldadura3"},
{id:"mandos-contactores",name:"Mandos por Contactor de Motores Asíncronos",kind:"contactores"},
{id:"mandos-neumaticos",name:"Mandos de Máquinas Neumáticas",kind:"neumatica"}
];
const status=document.createElement("div");
status.id="expansionStatus";
status.style.cssText="padding:12px 16px;background:#eaf2ff;color:#184983;border:1px solid #adcafb;border-radius:10px;margin:10px 0;font-size:13px";
status.textContent="Ampliación documental: cargando veinte manuales adicionales…";
document.querySelector(".aside")?.prepend(status);
window.SENATI_LIBRARY_READY=Promise.allSettled(catalog.map(async x=>{
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
// El texto OCR y los índices nuevos están a menudo en una sola línea.
// El parser original elimina la primera línea como encabezado: añadir un
// salto inicial protege todo el contenido recuperado.
const segments=pageSegments(x.kind,pg.p,"\n"+pg.t);
for(const seg of segments){SEGMENTS.push(seg);added++}
}
return {name:x.name,pages:seen.size,fragments:added};
})).then(results=>{
const success=results.filter(r=>r.status==="fulfilled").map(r=>r.value);
const failed=results.length-success.length;
status.textContent="Biblioteca SENATI ampliada: "+(3+success.length)+" manuales disponibles para búsqueda documental y consulta con IA."+(failed?" No se pudieron cargar "+failed+" manuales; los originales siguen operativos.":"");
const box=document.createElement("div");
box.style.cssText="font-size:12px;color:#365a87;margin-top:10px";
box.textContent="Fuentes añadidas: "+success.map(x=>x.pages+" págs. de "+x.name).join(" | ");
status.append(box);
const chatCounter=document.querySelector(".chatbar small");if(chatCounter)chatCounter.textContent=(3+success.length)+" manuales · citas por página · no reemplaza al instructor";
const panel=document.createElement("section");
panel.style.cssText="margin-top:12px;padding:10px;border-top:1px solid #c3d8f1";
const heading=document.createElement("div");heading.textContent="Seleccionar manual ampliado:";heading.style.cssText="font-weight:700;margin:0 0 7px";panel.append(heading);
const selector=document.createElement("select");selector.style.cssText="width:100%;padding:8px;border:1px solid #afc9e3;border-radius:8px;color:#123d70";
const first=document.createElement("option");first.value="all";first.textContent="Todos los manuales (originales y nuevos)";selector.append(first);
for(const item of catalog){if(!success.find(d=>d.name===item.name))continue;const option=document.createElement("option");option.value=item.kind;option.textContent=item.name;selector.append(option)}
selector.addEventListener("change",()=>{active=selector.value;document.querySelectorAll("[data-t]").forEach(button=>button.classList.remove("active"));document.querySelector("#status").textContent="Manual seleccionado: "+(catalog.find(x=>x.kind===active)?.name||"Todos")});
panel.append(selector);status.append(panel);
});
})();