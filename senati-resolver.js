/* Motor documental SENATI: preguntas verificadas, sin búsqueda web ficticia. */
(function(global){
  'use strict';
  const normal=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const source=(kind,p)=>({kind,p});
  const cases=[
    {id:'torno-partes',kind:'torno',p:22,patterns:[/\b(partes|componentes|elementos|estructura)\b.*\btorno\b/,/\btorno\b.*\b(partes|componentes|elementos|estructura)\b/,/\bcompone\b.*\btorno\b/],
      answer:'Las partes principales del torno mecánico horizontal o torno paralelo son:\n\n1. Bastidor: estructura que sostiene el conjunto.\n2. Bancada: base rígida con guías para el carro longitudinal y el cabezal móvil.\n3. Cabezal fijo: contiene el husillo que transmite el movimiento de rotación a la pieza.\n4. Carro longitudinal: se desplaza sobre la bancada y soporta los carros transversal y superior y la torreta portaherramientas.\n5. Carro transversal y carro superior: posicionan y desplazan la herramienta de corte.\n6. Caja Norton: regula avances automáticos y pasos de rosca.\n7. Cabezal móvil o contrapunta: apoya piezas y permite operaciones como taladrado y escariado.\n8. Tablero delantal: aloja mecanismos de avance de los carros.\n9. Motor y transmisión: proporcionan el movimiento.\n\nEl esquema también identifica el husillo del torno. No deben confundirse las partes con accesorios como el plato universal y las lunetas.'},
    {id:'fresadora-partes',kind:'fresadora',p:14,patterns:[/\b(partes|componentes|elementos|estructura)\b.*\bfresadora\b/,/\bfresadora\b.*\b(partes|componentes|elementos|estructura)\b/],
      answer:'Las partes principales de la fresadora son el bastidor, el husillo principal, la mesa portapiezas, el carro transversal, la ménsula o consola, la caja de velocidades y la caja de avances. El esquema también señala el árbol portafresa, el brazo soporte y el cabezal móvil. El husillo transmite el giro a la fresa; la mesa sujeta la pieza y los carros permiten sus desplazamientos.'},
    {id:'rectificadora-partes',kind:'rectificadora',p:11,patterns:[/\b(partes|componentes|elementos|estructura)\b.*\brectificadora\b/,/\brectificadora\b.*\b(partes|componentes|elementos|estructura)\b/],
      answer:'En la rectificadora plana se identifican el husillo de rectificar, el motor, la muela abrasiva, la mesa con su avance, el bastidor y los botones de encendido y apagado. La muela realiza el corte abrasivo y la mesa desplaza la pieza para lograr superficies de precisión.'},
    {id:'torno-def',kind:'torno',p:18,patterns:[/\b(que es|define|definicion|concepto|para que sirve|que hace)\b.*\btorno\b/],
      answer:'El torno mecánico es una máquina herramienta de mecanizado que hace girar una pieza mientras una herramienta de corte le da la forma requerida. Permite operaciones como cilindrado, refrentado, roscado, taladrado y moleteado, principalmente sobre piezas metálicas.'},
    {id:'fresadora-def',kind:'fresadora',p:14,patterns:[/\b(que es|define|definicion|concepto|para que sirve|que hace)\b.*\bfresadora\b/],
      answer:'La fresadora es una máquina herramienta que mecaniza materiales mediante una herramienta giratoria de corte llamada fresa. Permite producir superficies planas, cóncavas, convexas y combinadas. La mesa sujeta y desplaza la pieza de trabajo.'},
    {id:'rectificadora-def',kind:'rectificadora',p:11,patterns:[/\b(que es|define|definicion|concepto|para que sirve|que hace)\b.*\brectificadora\b/],
      answer:'La rectificadora es una máquina herramienta de precisión que emplea una muela abrasiva para corregir superficies y obtener medidas exactas y un acabado superficial fino. Se utiliza, por ejemplo, después de procesos de torneado o fresado.'},
    {id:'cilindrado',kind:'torno',p:11,patterns:[/\b(cilindrado|cilindrar|cilindrica)\b/],
      answer:'El cilindrado consiste en mecanizar una superficie cilíndrica de una pieza que gira en el torno. La herramienta avanza longitudinalmente en relación con su eje. Permite producir ejes, bujes y otras piezas cilíndricas.'},
    {id:'refrentado',kind:'torno',p:14,patterns:[/\b(refrentado|refrentar)\b/],
      answer:'El refrentado produce una cara plana perpendicular al eje de giro de la pieza. Se realiza con una herramienta de corte cuyo avance es transversal, por ejemplo para crear una cara de referencia o preparar una pieza antes del taladrado.'},
    {id:'moleteado',kind:'torno',p:105,patterns:[/\b(moleteado|moletear|moleteador)\b/],
      answer:'El moleteado forma surcos paralelos o cruzados mediante moletas que presionan la pieza mientras gira. Se emplea para mejorar el agarre manual de piezas como tuercas y tornillos.'},
    {id:'torno-preparar',kind:'torno',p:8,patterns:[/\b(acondicionar|preparar|lubricacion)\b.*\btorno\b/],
      answer:'Antes de utilizar el torno se revisan los carros, el cabezal móvil y el plato de sujeción, el estado y la lubricación de la máquina, la limpieza y el espacio de trabajo. Ante cualquier falla, debe detenerse la operación y consultar al instructor.'},
    {id:'fresadora-prensa',kind:'fresadora',p:6,patterns:[/\b(montar|instalar|fijar|colocar)\b.*\bprensa\b/,/\bprensa\b.*\bfresadora\b/],
      answer:'Para montar la prensa en la fresadora se limpia la mesa y su base, se ubica sobre la mesa, se hacen coincidir las guías y ranuras y se fija mediante tornillos o pernos de anclaje. Debe comprobarse la sujeción antes de trabajar.'},
    {id:'fresado-tangencial',kind:'fresadora',p:11,patterns:[/\b(fresado|fresar)\b.*\b(tangencial|horizontal|superficie plana)\b/],
      answer:'El fresado tangencial horizontal mecaniza la cara superior de una pieza mediante una fresa cilíndrica colocada sobre un portafresa horizontal. Antes de trabajar se fijan la prensa, la pieza y la herramienta, se seleccionan los parámetros y finalmente se comprueban las dimensiones.'},
    {id:'aparato-divisor',kind:'fresadora',p:202,patterns:[/\b(aparato|cabezal)\b.*\bdivisor\b/,/\bdivisor\b.*\bfresadora\b/],
      answer:'El aparato divisor permite girar la pieza por incrementos angulares controlados. Se emplea, por ejemplo, para el mecanizado de dientes de engranaje y de superficies distribuidas uniformemente alrededor de un eje.'},
    {id:'muela-rectificar',kind:'rectificadora',p:6,patterns:[/\b(rectificar|rectificado|reavivar)\b.*\bmuela\b/,/\bmuela\b.*\b(embotada|diamante)\b/],
      answer:'Rectificar una muela significa corregir su superficie cuando se ha deformado o embotado. Se utiliza una herramienta con punta de diamante y se deben mantener instaladas las protecciones y utilizar protección ocular.'},
    {id:'rectificado-plano',kind:'rectificadora',p:7,patterns:[/\b(rectificado|rectificar)\b.*\b(superficie plana|plano|plato magnetico)\b/],
      answer:'El rectificado plano utiliza una muela abrasiva giratoria y el movimiento de la mesa para obtener superficies planas con precisión. La pieza puede sujetarse sobre un plato magnético y debe comprobarse su fijación y limpieza.'},
    {id:'rectificado-paralelo',kind:'rectificadora',p:10,patterns:[/\b(rectificar|rectificado)\b.*\b(paralelas|paralelismo)\b/],
      answer:'El rectificado de superficies paralelas consiste en trabajar caras opuestas de una pieza, tomando como referencia la primera cara rectificada. Después se verifican las medidas y el paralelismo.'}
  ];
  function matching(q,selected='all'){
    const n=normal(q);
    if(!n)return null;
    const ranked=cases.filter(c=>selected==='all'||selected===c.kind).map(c=>{
      const points=c.patterns.reduce((a,re)=>a+(re.test(n)?1:0),0);
      return {...c,points}
    }).filter(c=>c.points>0).sort((a,b)=>{
      if(a.id.endsWith('partes')!==b.id.endsWith('partes'))return a.id.endsWith('partes')?-1:1;
      return b.points-a.points;
    });
    if(!ranked.length)return null;
    const c=ranked[0];
    return {text:c.answer,source:source(c.kind,c.p),trusted:true,confidence:1,topicId:c.id};
  }
  function answer(q,selected='all',fallback=null){
    const good=matching(q,selected);
    if(good)return good;
    if(fallback&&fallback.source?.kind){
      const text=String(fallback.text||'');
      // Se hace explícita la diferencia entre una respuesta y una cita documental.
      if(text.startsWith('Texto relacionado de ')){
        return {...fallback,text:'Encontré un fragmento del manual relacionado con tu consulta, pero no hay suficiente información para construir una explicación verificada automáticamente.\n\n'+text.slice(0,800),trusted:false,confidence:.35};
      }
      return {...fallback,trusted:!!fallback.trusted,confidence:fallback.trusted?1:.4};
    }
    return {text:'Esta pregunta aún no tiene una explicación técnica verificada en la versión documental. Los manuales están disponibles para consulta, pero para interpretar y responder libremente hace falta activar el motor de IA en el servidor.',source:null,trusted:false,confidence:0};
  }
  global.SenatiResolver=Object.freeze({answer,matching,normal,verifiedCases:cases.length});
})(typeof window!=='undefined'?window:this);