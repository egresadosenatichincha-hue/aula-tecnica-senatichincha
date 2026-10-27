/* Biblioteca SENATI v3: activación segura de 20 manuales adicionales.
 * La aplicación original se mantiene mientras Cloudflare no acepte 23 manuales.
 */
(function(){
  'use strict';
  const server='https://senati-aula-ia.egresadosenatichincha.workers.dev/';
  const panel=document.querySelector('.aside');
  if(!panel)return;
  const status=document.createElement('div');
  status.style.cssText='font-size:12px;line-height:1.55;padding:10px;margin:6px 0 12px;border-radius:9px;background:#eaf2ff;color:#124b9b';
  status.textContent='Verificando biblioteca ampliada de 20 manuales…';
  panel.prepend(status);
  const count=23; // 3 originales + 20 incorporados
  fetch(server,{cache:'no-store'})
    .then(async response=>{
      if(!response.ok)throw Error('Servidor no disponible');
      return response.json();
    })
    .then(info=>{
      if(info.ai_bound!==true || Number(info.manual_count)<count){
        status.textContent='Los 20 manuales están preparados. Para usarlos con IA falta actualizar el código en Cloudflare. Los 3 manuales originales siguen disponibles.';
        return;
      }
      status.textContent='El servidor de IA reconoce los 23 manuales. Cargando biblioteca…';
      const script=document.createElement('script');
      script.src='./expansion-preview.js?v=3';
      script.onload=()=>status.remove();
      script.onerror=()=>{status.textContent='No se pudo cargar la biblioteca ampliada. La versión original sigue disponible.'};
      document.body.appendChild(script);
    })
    .catch(()=>{status.textContent='Sin conexión con Cloudflare: sigue disponible la biblioteca original.'});
})();