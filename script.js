const inicio = document.getElementById('inicio');
const bar = document.getElementById('bar');
const botonKino = document.getElementById('boton-kino');
const botonVolver = document.getElementById('boton-volver');
const dialogo = document.getElementById('dialogo');
const escenario2 = document.getElementById('escenario2');

// Textos de la historia
const textos = [
    "Mi nombre es Kino, acabo de enterarme de que mi esposa me fue infiel.",
    "Lo extraño es que no siento rabia.",
    "Me fui de la casa. Compré y remodelé este bar, aunque no viene nadie.",
    "Igual me mantengo ocupado."
];

let textoActual = 0;

function mostrarBar() {
    inicio.classList.remove('activa');
    bar.classList.add('activa');

    inicio.setAttribute('aria-hidden', 'true');
    bar.setAttribute('aria-hidden', 'false');

    textoActual = 0;
    dialogo.textContent = textos[textoActual];
}

function mostrarInicio() {
    bar.classList.remove('activa');
    inicio.classList.add('activa');

    bar.setAttribute('aria-hidden', 'true');
    inicio.setAttribute('aria-hidden', 'false');
}

function siguienteTexto() {

    // Si ya estamos en el último diálogo,
    // avanzar al siguiente escenario.
    if (textoActual >= textos.length - 1) {
        mostrarEscenario2();
        return;
    }

    textoActual++;

    dialogo.style.animation = 'none';
    dialogo.textContent = textos[textoActual];

    void dialogo.offsetWidth;

    dialogo.style.animation = 'aparecerTexto 1.2s ease forwards';
}

function mostrarEscenario2() {
    bar.classList.remove('activa');
    escenario2.classList.add('activa');

    bar.setAttribute('aria-hidden', 'true');
    escenario2.setAttribute('aria-hidden', 'false');
}
botonKino.addEventListener('click', mostrarBar);
botonVolver.addEventListener('click', mostrarInicio);

dialogo.addEventListener('click', siguienteTexto);