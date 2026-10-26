# Activar IA gratuita — Aula Técnica SENATI Chincha

## Estado real
- El frontend está alojado en GitHub Pages.
- Los tres manuales ya disponen de un índice local; la app extrae fragmentos pertinentes y los remite con la pregunta.
- El servidor de IA está preparado en `cloudflare/src/index.js`, con modelo `@cf/google/gemma-4-26b-a4b-it`.
- **El servidor NO está desplegado ni activo hasta conectar una cuenta Cloudflare y obtener la URL workers.dev.**
- El servicio utiliza la asignación gratuita vigente, con límites diarios. No existe una garantía de consultas ilimitadas.
- El servidor no realiza una búsqueda web autónoma: se fundamenta en los manuales enviados en cada pregunta.

## Desplegar desde navegador (sin instalar software en los equipos de alumnos)

1. Crear o entrar en una cuenta gratuita: https://dash.cloudflare.com/sign-up
2. Entrar en **Workers & Pages** > **Create** > **Import a repository** o **Connect GitHub**.
3. Autorizar GitHub y elegir `egresadosenatichincha-hue/aula-tecnica-senatichincha`.
4. Configurar **Root directory**: `cloudflare`.
5. Para el proyecto Workers, utilizar el archivo `cloudflare/wrangler.jsonc`. Si la interfaz no detecta la configuración del subdirectorio, configurar el comando de despliegue `npx wrangler deploy` con directorio raíz `cloudflare`.
6. Verificar que el binding AI se llame exactamente `AI`; se define en `wrangler.jsonc`. Cloudflare debe mostrar un Worker como `https://senati-aula-ia.<subdominio>.workers.dev`.
7. Abrir la URL del Worker. Debe responder un JSON con `"status":"configured"`, `"ai_bound":true`.
8. Abrir https://egresadosenatichincha-hue.github.io/aula-tecnica-senatichincha/ en tu navegador. En el pie de la conversación pulsar **Conectar servidor IA** y pegar la URL del Worker (sin /ask). Se guarda en este navegador; cada alumno necesitaría configurar la URL una vez mientras no la configuremos como valor global de despliegue.
9. Probar `¿Cuáles son las partes principales del torno mecánico horizontal?`; se debe mostrar una explicación con el manual Torno I como fuente y opción de lectura por voz.

## Muy importante

- **No subas contraseñas, tokens de GitHub, claves de Cloudflare ni secretos a este repositorio público.**
- Las consultas, junto con extractos de manuales, se envían desde el dispositivo del usuario al Worker. Cloudflare procesa las peticiones de IA.
- Las salidas generadas por un modelo pueden fallar; las instrucciones operativas sobre maquinaria requieren revisión del instructor.
- La web funciona con texto local sin conexión después de la primera carga, pero **la IA en la nube necesita internet**.
- Los enlaces externos de fabricantes no implican verificación automatizada de sus contenidos.
- Se recomienda añadir control de uso por alumno, límites por IP y protección contra abuso antes de ofrecer el servidor público a una audiencia grande.
- GitHub Pages y Cloudflare Workers son servicios diferentes; no cambiar GitHub Pages al crear el Worker.

## Pruebas del servidor
```bash
curl -X POST https://senati-aula-ia.SUBDOMINIO.workers.dev/ask \
  -H 'Origin: https://egresadosenatichincha-hue.github.io' \
  -H 'Content-Type: application/json' \
  -d '{"question":"¿Cuáles son las partes principales del torno?","evidence":[{"kind":"torno","p":22,"text":"Partes principales del torno paralelo: bastidor, bancada, cabezal fijo, carro longitudinal, caja Norton y cabezal móvil."}]}'
```
Con menos de 90 caracteres de evidencia, el servidor la descarta para evitar atribuciones insuficientes. Usa el contenido documental completo para la prueba real.

Actualizado: 26-10-2026.
