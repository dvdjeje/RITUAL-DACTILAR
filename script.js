/* ==========================================================
   KINO — Versión fusionada
   Base: ritual musical original + rutinas de 15 días.
   La sesión comienza desde el día 1 al recargar.
   ========================================================== */
const $ = id => document.getElementById(id);
const inicio=$('inicio'), bar=$('bar'), explorar=$('escenario2'), musica=$('escenario-musica');
const bebida=$('escenario-bebida'), plantas=$('escenario-plantas'), transicion=$('transicion-dia');
const audio=$('audio-jazz'), dialogo=$('dialogo'), funda=$('funda-central');
const viniloLibre=$('vinilo-libre'), plato=$('zona-plato'), canvas=$('canvas-vinilo');
const aguja=$('aguja-touch'), destino=$('destino-aguja'), carrusel=$('carrusel');
const ctx=canvas.getContext('2d');
 const albumes = [
  {
    nombre: 'Art Tatum',
    id: 'art',
    foto: 'assets/discos/1.jpeg',
    color: '#b96747',
    cancion: 'assets/audio/art-tatum.mp3'
  },
  {
    nombre: 'Coleman Hawkins',
    id: 'coleman',
    foto: 'assets/discos/2.jpeg',
    color: '#c1834f',
    cancion: 'assets/audio/coleman-hawkins.wav'
  },
  {
    nombre: 'Billie Holiday',
    id: 'billie',
    foto: 'assets/discos/3.jpeg',
    color: '#558f99',
    cancion: 'assets/audio/billie-holiday.wav'
  }
];
const textos=[
  'Mi nombre es Kino, acabo de enterarme de que mi esposa me fue infiel.',
  'Lo extraño es que no siento rabia.',
  'Me fui de la casa. Compré y remodelé este bar, aunque no viene nadie.',
  'Igual me mantengo ocupado.'
];
let textoActual=0, seleccion=0, estado='elegir', gesto=null, agujaGesto=null;
let raf=null, inicioAnimacion=0, pensamientoCallback=null, pensamientoPendiente=false;
const progresoInicial=()=>({dia:1,conteos:{art:0,coleman:0,billie:0},paso:'musica',ultima:null,escuchadosHoy:[],bebidaCompletada:false,plantasCompletadas:false});
let progreso=progresoInicial();
const anunciar=t=>$('estado').textContent=t;
const activo=p=>p.classList.contains('activa');

/* 1. Navegación y diálogos */
function mostrar(p){
  for(const x of [inicio,bar,explorar,musica,bebida,plantas,transicion]){
    const on=x===p; x.classList.toggle('activa',on); x.setAttribute('aria-hidden',String(!on));
  }
  if(p!==musica){audio.pause(); cancelAnimationFrame(raf); raf=null;}
  if(p!==bebida){detenerVertido();sensorActivo=false;}
  if(p!==plantas)clearInterval(riegoTimer);
}
function mostrarBar(){
  textoActual=0;dialogo.textContent=textos[0];
  dialogo.classList.remove('cambiando');void dialogo.offsetWidth;dialogo.classList.add('cambiando');mostrar(bar);
}
function siguienteTexto(){
  if(textoActual===textos.length-1){refrescarRutina();mostrar(explorar);return;}
  dialogo.textContent=textos[++textoActual];dialogo.classList.remove('cambiando');
  void dialogo.offsetWidth;dialogo.classList.add('cambiando');
}
function mostrarPensamiento(frase,continuar=()=>{}){
  $('pensamiento-texto').textContent='«'+frase+'»';pensamientoCallback=continuar;
  $('pensamiento').hidden=false;
}
$('pensamiento-continuar').addEventListener('click',()=>{
  const fn=pensamientoCallback;pensamientoCallback=null;$('pensamiento').hidden=true;
  if(fn)fn();
});

/* 2. Carrusel de vinilos */
const foto=i=>albumes[(i+albumes.length)%albumes.length].foto;
function refrescar(){
  $('album-izq').src=foto(seleccion-1);$('album-centro').src=foto(seleccion);$('album-der').src=foto(seleccion+1);
  $('album-centro').alt=albumes[seleccion].nombre;
  document.querySelectorAll('.puntos i').forEach((d,i)=>d.classList.toggle('on',i===seleccion));
  document.querySelectorAll('.centro-vinilo').forEach(el=>el.style.background=albumes[seleccion].color);
}
function cambiar(n){if(estado!=='elegir')return;seleccion=(seleccion+n+albumes.length)%albumes.length;refrescar();}
function coord(e){const r=$('escena-musica').getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function dentroPlato(e){
  const r=plato.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  return ((e.clientX-cx)/(r.width*.72))**2+((e.clientY-cy)/(r.height*1.5))**2<=1;
}
function moverLibre(e){const p=coord(e);viniloLibre.style.left=p.x+'px';viniloLibre.style.top=p.y+'px';plato.classList.toggle('cerca',dentroPlato(e));}
function extraerInicio(e){
  if(estado!=='elegir'||e.button>0)return;e.preventDefault();funda.setPointerCapture(e.pointerId);
  gesto={id:e.pointerId,x:e.clientX,y:e.clientY,tipo:null};
}
function extraerMover(e){
  if(!gesto||gesto.id!==e.pointerId)return;
  const dx=e.clientX-gesto.x,dy=e.clientY-gesto.y;
  if(!gesto.tipo){
    if(Math.abs(dx)<12&&Math.abs(dy)<12)return;
    gesto.tipo=Math.abs(dx)>Math.abs(dy)*1.35?'swipe':'vinilo';
    if(gesto.tipo==='vinilo'){funda.classList.add('extrayendo');viniloLibre.hidden=false;}
  }
  if(gesto.tipo==='vinilo')moverLibre(e);
}
function extraerFin(e){
  if(!gesto||gesto.id!==e.pointerId)return;
  const g=gesto;gesto=null;funda.classList.remove('extrayendo');
  if(g.tipo==='swipe'){if(Math.abs(e.clientX-g.x)>30)cambiar(e.clientX<g.x?1:-1);return;}
  if(g.tipo==='vinilo'&&dentroPlato(e))ponerDisco();
  else{viniloLibre.hidden=true;plato.classList.remove('cerca');}
}
function ponerDisco(){
  if(estado!=='elegir')return;
  estado='aguja';viniloLibre.hidden=true;plato.classList.remove('cerca','sonando');plato.classList.add('colocado');
  carrusel.classList.add('bloqueado');$('puntos').style.opacity='0';
  aguja.classList.add('visible');destino.classList.add('visible');dibujarDisco(0);
  anunciar('Vinilo colocado. Arrastra la aguja hacia la izquierda.');
}

/* 3. Aguja: conservar arrastre, aguja metálica y ausencia de brillos al sonar */
function iniciarAguja(e){
  if(estado!=='aguja'||e.button>0)return;e.preventDefault();aguja.setPointerCapture(e.pointerId);
  agujaGesto={id:e.pointerId,x:e.clientX,y:e.clientY};aguja.classList.add('moviendo');
}
function moverAguja(e){
  if(!agujaGesto||agujaGesto.id!==e.pointerId)return;e.preventDefault();
  const dx=Math.min(0,Math.max(-45,e.clientX-agujaGesto.x));
  const dy=Math.max(-20,Math.min(20,e.clientY-agujaGesto.y));
  aguja.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  destino.style.opacity=dx< -15?'1':'.45';
}
function terminarAguja(e){
  if(!agujaGesto||agujaGesto.id!==e.pointerId)return;
  const dx=e.clientX-agujaGesto.x;agujaGesto=null;aguja.classList.remove('moviendo');
  if(dx<=-20){aguja.style.transform='translate(calc(-50% - 30px),calc(-50% - 3px))';tocar();}
  else{aguja.style.transform='';destino.style.opacity='1';}
}
function dibujarDisco(t){
  const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.save();
  ctx.translate(W/2,H/2);ctx.scale(1,.44);const radio=265;
  const grad=ctx.createRadialGradient(0,0,35,0,0,radio);
  grad.addColorStop(0,'#201321');grad.addColorStop(.5,'#100c17');grad.addColorStop(.92,'#201827');grad.addColorStop(1,'#0b0811');
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,radio,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#584052';ctx.lineWidth=1.6;
  for(let r=90;r<264;r+=12){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
  ctx.save();ctx.rotate(t);ctx.fillStyle=albumes[seleccion].color;ctx.beginPath();ctx.arc(0,0,78,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#dba076';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,67,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#3c2138';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-30,-28);ctx.lineTo(34,26);ctx.moveTo(-19,32);ctx.lineTo(20,-33);ctx.stroke();
  ctx.fillStyle='#eac5a0';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.restore();ctx.restore();
}
function frame(t){if(estado!=='sonando'||!activo(musica))return;dibujarDisco((t-inicioAnimacion)/900);raf=requestAnimationFrame(frame);}

function tocar() {

  if (estado !== 'aguja') return;

  estado = 'sonando';

  // Mantener la aguja colocada y ocultar los brillos
  aguja.classList.add('completado');
  destino.classList.add('completado');

  destino.style.opacity = '';
  plato.classList.remove('cerca');
  plato.classList.add('sonando');

  // Iniciar la animación del vinilo
  inicioAnimacion = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);


  // Obtener la canción del disco seleccionado
  const discoSeleccionado = albumes[seleccion];

  audio.pause();
  audio.src = discoSeleccionado.cancion;
  audio.load();
  audio.currentTime = 0;
  audio.playbackRate = 1;

  audio.play().catch(() => {

    anunciar('Toca el disco para activar el sonido.');

    plato.style.pointerEvents = 'auto';

    plato.onclick = () => {
      audio.play().catch(() => {
        anunciar('No se pudo reproducir la canción.');
      });
    };

  });

  anunciar('Reproduciendo ' + discoSeleccionado.nombre);

  // Conservar el sistema narrativo de los 15 días
  pensamientoPendiente = true;

  setTimeout(() => {

    if (
      estado === 'sonando' &&
      activo(musica) &&
      pensamientoPendiente
    ) {

      pensamientoPendiente = false;
      revelarPensamiento();

    }

  }, 1100);

}

function reiniciar(){
  pensamientoPendiente=false;audio.pause();audio.currentTime=0;cancelAnimationFrame(raf);raf=null;
  estado='elegir';gesto=null;agujaGesto=null;plato.classList.remove('colocado','cerca','sonando');
  ctx.clearRect(0,0,canvas.width,canvas.height);carrusel.classList.remove('bloqueado');$('puntos').style.opacity='1';
  aguja.className='aguja-touch';aguja.style.transform='';destino.className='destino-aguja';destino.style.opacity='';
 viniloLibre.hidden=true;plato.style.pointerEvents='none';plato.onclick=null;
  anunciar('Puedes elegir otro vinilo.');
}

/* 4. Narrativa musical: los 15 pensamientos avanzan según día y repetición */
function fraseMusical(id){
  const n=progreso.conteos[id],etapaDia=Math.floor((progreso.dia-1)/3);
  const etapaRepeticion=Math.min(4,Math.max(0,n-1));
  const etapa=Math.min(etapaDia,etapaRepeticion),variacion=(progreso.dia-1)%3;
  return window.KINO_DIALOGOS[id][etapa*3+variacion];
}

function revelarPensamiento() {
  const id = albumes[seleccion].id;

  // Registrar el único disco escuchado esta noche
  if (progreso.escuchadosHoy.length > 0) return;

  progreso.conteos[id]++;
  progreso.escuchadosHoy.push(id);

  progreso.ultima = id;
  progreso.paso = 'bebida';

  const frase = fraseMusical(id);

  mostrarPensamiento(frase, () => {
    // Detener la canción y reiniciar el tocadiscos
    reiniciar();

    // Actualizar las actividades disponibles
    refrescarRutina();

    // Volver automáticamente al hub
    mostrar(explorar);
  });
}

function refrescarRutina(){
  $('marca-dia').textContent='Día '+progreso.dia;
  const final=progreso.paso==='final',musicaHecha=progreso.escuchadosHoy.length>0;
 $('boton-tocadiscos').hidden = final || musicaHecha;
  $('boton-tocadiscos').classList.toggle('hecha',musicaHecha);
  $('boton-bebida').hidden=!musicaHecha||progreso.bebidaCompletada||final;
  $('boton-plantas').hidden=!progreso.bebidaCompletada||progreso.plantasCompletadas||final;
  $('boton-cerrar').hidden=!progreso.plantasCompletadas||final;
}

/* 5. Bebida: hielo, inclinación del teléfono o alternativa táctil, entrega */
let hielos=0,porcentaje=0,vertidoTimer=null,vasoDrag=null;
let sensorActivo=false,anguloBase=null,ultimoAngulo=null,botellaLista=false;
const botella=$('botella-ritual'),ayudaSensor=$('ayuda-inclinacion'),fallback=$('servir-alternativo'),vaso=$('vaso-ritual');
function detenerVertido(){if(vertidoTimer!==null)clearInterval(vertidoTimer);vertidoTimer=null;botella.classList.remove('sirviendo');}

function actualizaWhisky(cantidad) {
  porcentaje = Math.min(100, Math.max(0, cantidad));

  $('liquido').style.height = porcentaje + '%';

  // Ocultar el diagrama apenas empiece a caer whisky
  if (porcentaje > 0) {
    ayudaSensor.classList.remove('visible');
  }

  if(porcentaje>=100){detenerVertido();sensorActivo=false;botellaLista=false;
    $('servir-destino').classList.add('visible');ayudaSensor.classList.remove('visible');fallback.hidden=true;
    $('estado-bebida').textContent='Bebida lista. Arrastra el vaso hacia la izquierda.';
  }
}
function empezarBebida(){
  detenerVertido();hielos=0;porcentaje=0;vasoDrag=null;sensorActivo=false;botellaLista=false;anguloBase=null;ultimoAngulo=null;
  $('hielo-num').textContent='0/2';$('cubitos').classList.remove('listo');$('liquido').style.height='0%';
  $('hielos-visual').replaceChildren();vaso.style.transform='';$('servir-destino').classList.remove('visible');
  botella.style.transform='';ayudaSensor.classList.remove('visible');fallback.hidden=true;mostrar(bebida);
  $('brillo-tapa').hidden = true;
}

$('cubitos').addEventListener('click', () => {
  if (hielos >= 2) return;

  hielos++;

  $('hielo-num').textContent = hielos + '/2';
  $('hielos-visual').appendChild(document.createElement('span'));

  if (hielos === 2) {
    $('cubitos').classList.add('listo');

    // Mostrar el círculo sobre la tapa
    $('brillo-tapa').hidden = false;

    $('estado-bebida').textContent =
      'Toca la tapa de la botella.';
  }
});

function activarAlternativa(){
  sensorActivo=false;ayudaSensor.classList.remove('visible');fallback.hidden=false;
  $('estado-bebida').textContent='Mantén presionado el botón circular para servir.';
}
async function prepararSensor(){
  if(hielos<2||porcentaje>=100||botellaLista)return;
  botellaLista=true;$('brillo-tapa').hidden = true;ayudaSensor.classList.add('visible');
  if(!window.DeviceOrientationEvent||!window.isSecureContext){activarAlternativa();return;}
  try{
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
      const permiso=await DeviceOrientationEvent.requestPermission();
      if(permiso!=='granted'){activarAlternativa();return;}
    }
    if(!activo(bebida))return;
    sensorActivo=true;anguloBase=null;ultimoAngulo=null;
    setTimeout(()=>{if(sensorActivo&&ultimoAngulo===null&&activo(bebida))activarAlternativa();},1700);
  }catch{activarAlternativa();}
}
botella.addEventListener('click',prepararSensor);
window.addEventListener('deviceorientation',e=>{
  if(!sensorActivo||!activo(bebida)||porcentaje>=100)return;
  const actual=Number.isFinite(e.gamma)?e.gamma:null;if(actual===null)return;
  ultimoAngulo=actual;if(anguloBase===null){anguloBase=actual;return;}
  const inclinacion = Math.abs(actual - anguloBase),
      factor = Math.min(1, Math.max(0, (inclinacion - 5) / 12));
  botella.style.transform=`rotate(${-Math.round(factor*45)}deg)`;
  botella.classList.toggle('sirviendo',factor>.1);
  if(factor>.1)actualizaWhisky(porcentaje+factor*1.25);
},{passive:true});
fallback.addEventListener('pointerdown',e=>{
  if(fallback.hidden||hielos<2||porcentaje>=100)return;
  e.preventDefault();fallback.setPointerCapture(e.pointerId);
  detenerVertido();botella.classList.add('sirviendo');
  vertidoTimer=setInterval(()=>actualizaWhisky(porcentaje+2.5),55);
});
['pointerup','pointercancel','lostpointercapture'].forEach(t=>fallback.addEventListener(t,detenerVertido));
function entregarBebida(){
  if(porcentaje<100||hielos<2||progreso.bebidaCompletada)return;
  progreso.bebidaCompletada=true;progreso.paso='plantas';vaso.style.transform='';
  refrescarRutina();mostrar(explorar);mostrarPensamiento(window.KINO_BEBIDAS[progreso.dia-1]);
}
vaso.addEventListener('pointerdown',e=>{
  if(porcentaje<100||hielos<2)return;e.preventDefault();vaso.setPointerCapture(e.pointerId);
  vasoDrag={id:e.pointerId,x:e.clientX,y:e.clientY};vaso.classList.add('moviendo');
});
vaso.addEventListener('pointermove',e=>{
  if(!vasoDrag||vasoDrag.id!==e.pointerId)return;
  vaso.style.transform=`translate(${e.clientX-vasoDrag.x}px,${e.clientY-vasoDrag.y}px)`;
});

vaso.addEventListener('pointerup', e => {
  if (!vasoDrag || vasoDrag.id !== e.pointerId) return;

  const dx = e.clientX - vasoDrag.x;
  const dy = e.clientY - vasoDrag.y;

  vasoDrag = null;
  vaso.classList.remove('moviendo');

  // Posición actual del vaso
  const rectVaso = vaso.getBoundingClientRect();

  // Posición real del destino definido en CSS
  const rectDestino = $('servir-destino').getBoundingClientRect();

  // Centro del vaso
  const centroX = rectVaso.left + rectVaso.width / 2;
  const centroY = rectVaso.top + rectVaso.height / 2;

  // Comprobar si el centro del vaso está dentro del destino
  const dentroDestino =
    centroX >= rectDestino.left &&
    centroX <= rectDestino.right &&
    centroY >= rectDestino.top &&
    centroY <= rectDestino.bottom;

  if (dentroDestino) {
    entregarBebida();
  } else {
    vaso.style.transform = '';
  }
});

vaso.addEventListener('pointercancel',()=>{vasoDrag=null;vaso.style.transform='';vaso.classList.remove('moviendo');});
vaso.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&porcentaje>=100){e.preventDefault();entregarBebida();}});


/* 6. Plantas: riego mediante trazos táctiles */

let agua = 0;
let plantaPointer = null;
let ultimoPunto = null;
let inicioRiego = null;
let riegoTimer = null;
let zonasRegadas = new Set();

const planta = $('planta-natural');
const lluvia = $('lluvia-natural');

function abrirPlantas() {
  agua = 0;
  plantaPointer = null;
  ultimoPunto = null;
  zonasRegadas.clear();

  clearInterval(riegoTimer);
  lluvia.replaceChildren();

  $('estado-plantas').textContent =
    'Desliza el dedo sobre la planta para regarla.';

  mostrar(plantas);
  $('guia-riego').classList.remove('oculta');
}

// Crear una gota en la posición del dedo
function crearGota(x, y) {
  const rect = lluvia.getBoundingClientRect();

  const gota = document.createElement('i');
  gota.className = 'gota-natural';

  gota.style.left =
    (x - rect.left + (Math.random() - 0.5) * 12) + 'px';

  gota.style.top =
    (y - rect.top - 12 - Math.random() * 10) + 'px';

  lluvia.appendChild(gota);

  setTimeout(() => gota.remove(), 750);
}

// Registrar qué partes de la planta han recibido agua

function registrarRiego(x, y) {
  // El riego se completa al soltar el dedo.
  // Ya no es necesario cubrir distintas zonas.
  if (progreso.plantasCompletadas) return;

  agua = Math.min(90, agua + 3);

  $('estado-plantas').textContent =
    'Regando la planta...';
}


// Dibujar el recorrido del dedo con gotas
function pintarAgua(e) {
  if (
    plantaPointer !== e.pointerId ||
    progreso.plantasCompletadas
  ) return;

  e.preventDefault();

  const actual = {
    x: e.clientX,
    y: e.clientY
  };

  if (!ultimoPunto) {
    ultimoPunto = actual;
    return;
  }

  const distancia = Math.hypot(
    actual.x - ultimoPunto.x,
    actual.y - ultimoPunto.y
  );

  if (distancia < 3) return;

  // Crear varias gotas entre ambos puntos
  // para que el trazo sea continuo
  const pasos = Math.max(1, Math.ceil(distancia / 7));

  for (let i = 1; i <= pasos; i++) {
    const t = i / pasos;

    const x =
      ultimoPunto.x + (actual.x - ultimoPunto.x) * t;

    const y =
      ultimoPunto.y + (actual.y - ultimoPunto.y) * t;

    crearGota(x, y);
    registrarRiego(x, y);

    if (progreso.plantasCompletadas) break;
  }

  ultimoPunto = actual;
}

// Comenzar a pintar
planta.addEventListener('pointerdown', e => {
  if (
    e.button > 0 ||
    progreso.plantasCompletadas
  ) return;

  e.preventDefault();
$('guia-riego').classList.add('oculta');
  planta.setPointerCapture(e.pointerId);

  plantaPointer = e.pointerId;
  inicioRiego = performance.now();

  ultimoPunto = {
    x: e.clientX,
    y: e.clientY
  };

  crearGota(e.clientX, e.clientY);
  registrarRiego(e.clientX, e.clientY);
});

// Continuar pintando
planta.addEventListener('pointermove', pintarAgua);

// Terminar el ritual apenas esté regada
function terminarPlantas() {
  if (progreso.plantasCompletadas) return;

  plantaPointer = null;
  ultimoPunto = null;

  progreso.plantasCompletadas = true;
  progreso.paso = 'cierre';

  $('estado-plantas').textContent =
    'La planta está regada.';

  setTimeout(() => {
    refrescarRutina();
    mostrar(explorar);

    mostrarPensamiento(
      window.KINO_PLANTAS[progreso.dia - 1]
    );
  }, 650);
}

// Soltar el dedo

planta.addEventListener('pointerup', e => {
  if (plantaPointer !== e.pointerId) return;

  const tiempoRegando = performance.now() - inicioRiego;

  plantaPointer = null;
  ultimoPunto = null;
  inicioRiego = null;

  if (tiempoRegando >= 1000) {
    // Regó durante al menos un segundo
    agua = 100;
    terminarPlantas();
  } else {
    // Soltó demasiado rápido
    $('estado-plantas').textContent =
      'Mantén el dedo al menos un segundo para regar.';
  }
});


['pointercancel', 'lostpointercapture'].forEach(tipo => {
  planta.addEventListener(tipo, () => {
    plantaPointer = null;
    ultimoPunto = null;
    inicioRiego = null;
  });
});

/* 7. Cierre del día */
function terminarNoche(){
  if(progreso.paso!=='cierre')return;
  mostrar(transicion);
  if(progreso.dia===15){
    progreso.paso='final';$('texto-dia').textContent='Quince noches';
    setTimeout(()=>mostrarPensamiento('He pasado estas noches haciendo siempre lo mismo. Tal vez todavía me quede algo que escuchar dentro de mí.',()=>{refrescarRutina();mostrar(explorar);}),700);
    return;
  }
  progreso.dia++;progreso.paso='musica';progreso.escuchadosHoy=[];
  progreso.bebidaCompletada=false;progreso.plantasCompletadas=false;
  $('texto-dia').textContent='Día '+progreso.dia;
  setTimeout(()=>{reiniciar();refrescarRutina();mostrar(explorar);},1500);
}

/* 8. Eventos */
$('boton-kino').addEventListener('click',()=>{
  if(progreso.dia===1&&progreso.paso==='musica')mostrarBar();
  else{refrescarRutina();mostrar(explorar);}
});
$('boton-volver').addEventListener('click',()=>mostrar(inicio));
dialogo.addEventListener('click',siguienteTexto);

$('boton-tocadiscos').addEventListener('click', () => {

  // Solo se puede escuchar un disco por noche
  if (
    progreso.paso !== 'musica' ||
    progreso.escuchadosHoy.length > 0
  ) return;

  reiniciar();
  mostrar(musica);
  refrescar();

});

$('regresar-bar').addEventListener('click',()=>{reiniciar();refrescarRutina();mostrar(explorar);});
$('boton-bebida').addEventListener('click',empezarBebida);
$('volver-bebida').addEventListener('click',()=>{detenerVertido();sensorActivo=false;refrescarRutina();mostrar(explorar);});
$('boton-plantas').addEventListener('click',abrirPlantas);
$('volver-plantas').addEventListener('click',()=>{clearInterval(riegoTimer);refrescarRutina();mostrar(explorar);});
$('boton-cerrar').addEventListener('click',terminarNoche);
carrusel.querySelectorAll('.lateral').forEach(btn=>btn.addEventListener('click',()=>cambiar(Number(btn.dataset.offset))));
funda.addEventListener('pointerdown',extraerInicio);
funda.addEventListener('pointermove',extraerMover);
funda.addEventListener('pointerup',extraerFin);
funda.addEventListener('pointercancel',e=>{
  if(gesto&&gesto.id===e.pointerId){gesto=null;viniloLibre.hidden=true;funda.classList.remove('extrayendo');plato.classList.remove('cerca');}
});
let deslize=null;
carrusel.querySelectorAll('.lateral').forEach(btn=>{
  btn.addEventListener('pointerdown',e=>{deslize={x:e.clientX,id:e.pointerId};});
  btn.addEventListener('pointerup',e=>{
    if(deslize&&deslize.id===e.pointerId&&Math.abs(e.clientX-deslize.x)>28){
      e.preventDefault();cambiar(e.clientX<deslize.x?1:-1);
    }
    deslize=null;
  });
});
aguja.addEventListener('pointerdown',iniciarAguja);
aguja.addEventListener('pointermove',moverAguja);
aguja.addEventListener('pointerup',terminarAguja);
aguja.addEventListener('pointercancel',()=>{
  agujaGesto=null;aguja.classList.remove('moviendo');aguja.style.transform='';
});
funda.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft')cambiar(-1);
  if(e.key==='ArrowRight')cambiar(1);
  if((e.key==='Enter'||e.key===' ')&&estado==='elegir'){e.preventDefault();ponerDisco();}
});
aguja.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&estado==='aguja'){
    e.preventDefault();aguja.style.transform='translate(calc(-50% - 30px),calc(-50% - 3px))';tocar();
  }
});
refrescar();refrescarRutina();
