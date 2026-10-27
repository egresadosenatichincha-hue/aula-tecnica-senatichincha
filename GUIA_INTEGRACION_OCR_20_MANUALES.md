# Aula Técnica SENATI — Incorporación de manuales escaneados

## Preparación realizada
- OCR en español de los seis manuales escaneados: 1.145 páginas, conservando número físico de PDF.
- Archivo ZIP de seis índices JSON más un manifiesto de control.
- Catálogo ampliado de 20 manuales y ruta de consulta para cada índice.
- Importación automática de los seis JSON mediante la acción de GitHub `.github/workflows/importar-manuales-ocr.yml`.
- Código del Worker preparado para reconocer los 23 libros (los tres iniciales más 20 incorporados), PERO no publicado automáticamente en Cloudflare.

## Importar OCR sin instalar programas
1. Descargar de la conversación el archivo `SENATI_OCR_6_Manuales_Indices.zip`.
2. Abrir el repositorio `egresadosenatichincha-hue/aula-tecnica-senatichincha` en GitHub, rama principal.
3. En **Add file > Upload files**, subir el ZIP *con ese nombre exacto* en la **raíz** del repositorio. Confirmar **Commit changes**.
4. En la pestaña **Actions**, revisar que se ejecute **Importar OCR de manuales SENATI**. El flujo añadirá los seis índices a `data/ampliados/`. Si el flujo falla con permisos de git push, habilitar **Settings > Actions > General > Workflow permissions > Read and write permissions** y volver a ejecutar.
5. Comprobar que aparezcan los JSON `soldadura-mantenimiento-i.json`, `afilado-manual.json`, `soldadura-mantenimiento-ii.json`, `soldadura-mantenimiento-iii.json`, `mandos-contactores.json`, `mandos-neumaticos.json`.

## Pruebas previas a activar en la página de alumnos
- Abrir `https://egresadosenatichincha-hue.github.io/aula-tecnica-senatichincha/biblioteca-ampliada-prueba.html` y verificar los nuevos índices.
- En Cloudflare `senati-aula-ia`, el código fuente actualizado está en `cloudflare/src/index.js` del repositorio. Para que la IA responda con citas a los nuevos manuales, es necesario **publicar ese código** en el Worker; el proyecto Cloudflare creado manualmente no despliega automáticamente los cambios del repositorio.
- Después, ejecutar pruebas con preguntas de Soldadura I, Afilado y Mandos Neumáticos y confirmar cita a página y audio. Solo cuando pasen las pruebas, incorporar el catálogo a `index.html` de alumnos.

## Limitaciones importantes
- El texto OCR puede equivocarse en parámetros de soldadura, símbolos neumáticos, medidas, tablas y esquemas. No usar dichas lecturas como instrucciones operativas sin validar el PDF original.
- Los archivos JSON son índices de texto, no conservan por sí mismos dibujos ni diagramas.
- El enlace de alumnos y las funciones actuales de voz permanecen intactos hasta que se complete la validación.
- No afirmar que el proceso está activo en Cloudflare solamente por haber subido archivos a GitHub.
