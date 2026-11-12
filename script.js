const inicio = document.getElementById('inicio');
const bar = document.getElementById('bar');
const botonKino = document.getElementById('boton-kino');
const botonVolver = document.getElementById('boton-volver');

function mostrarBar() {
  inicio.classList.remove('activa');
  bar.classList.add('activa');
  inicio.setAttribute('aria-hidden', 'true');
  bar.setAttribute('aria-hidden', 'false');
}

function mostrarInicio() {
  bar.classList.remove('activa');
  inicio.classList.add('activa');
  bar.setAttribute('aria-hidden', 'true');
  inicio.setAttribute('aria-hidden', 'false');
}

// El evento click también funciona con un toque del dedo en el celular.
botonKino.addEventListener('click', mostrarBar);
botonVolver.addEventListener('click', mostrarInicio);
