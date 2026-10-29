const elementoHora = document.getElementById("hora");

// Relación entre los datos JSON y los elementos de tu HTML.
const personajes = [
  {
    claveTexto: "ventana_1",
    claveAudio: "audio_ventana_1",
    textoId: "texto-ventana1",
    ventanaId: "ventana1",
    informacionId: "informacion-ventana1"
  },
  {
    claveTexto: "ventana_3",
    claveAudio: "audio_ventana_2",
    textoId: "texto-ventana3",
    ventanaId: "ventana3",
    informacionId: "informacion-ventana3"
  },
  {
    claveTexto: "ventana_4",
    claveAudio: "audio_ventana_3",
    textoId: "texto-ventana4",
    ventanaId: "ventana4",
    informacionId: "informacion-ventana4"
  },
  {
    claveTexto: "ventana_5",
    claveAudio: "audio_ventana_4",
    textoId: "texto-ventana5",
    ventanaId: "ventana5",
    informacionId: "informacion-ventana5"
  }
];

let datos = [];
let audios = {};

// Convierte "5:00" en minutos desde medianoche.
function convertirAMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

// Busca el objeto JSON que corresponde a la hora actual.
function obtenerDatosActuales() {
  const ahora = new Date();
  const minutosActuales =
    ahora.getHours() * 60 + ahora.getMinutes();

  return datos.find((franja) => {
    const inicio = convertirAMinutos(franja.hora_inicio);
    const fin = convertirAMinutos(franja.hora_fin);

    // Horarios normales, por ejemplo 8:00 a 12:00.
    if (inicio < fin) {
      return minutosActuales >= inicio &&
             minutosActuales < fin;
    }

    // Horarios que pasan por medianoche, de 21:00 a 5:00.
    return minutosActuales >= inicio ||
           minutosActuales < fin;
  });
}

// Actualiza los cuatro textos desde el JSON.
function actualizarContenido() {
  const franjaActual = obtenerDatosActuales();

  if (!franjaActual) {
    console.error("No hay datos para la hora actual.");
    return;
  }

  personajes.forEach((personaje) => {
    const elemento = document.getElementById(
      personaje.textoId
    );

    if (elemento) {
      // Los textos del JSON se insertan como texto plano.
      elemento.textContent =
        franjaActual[personaje.claveTexto] || "";
    }
  });

  // Guarda los audios correspondientes a esta franja.
  audios = {};

  personajes.forEach((personaje) => {
    audios[personaje.ventanaId] =
      franjaActual[personaje.claveAudio] || "";
  });
}

// Reloj digital.
function actualizarReloj() {
  const ahora = new Date();

  elementoHora.textContent = ahora.toLocaleTimeString(
    "es-ES",
    {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  );
}

let audioActual = null;

personajes.forEach((personaje) => {
  const ventana = document.getElementById(
    personaje.ventanaId
  );

  const informacion = document.getElementById(
    personaje.informacionId
  );

  if (!ventana || !informacion) return;

  ventana.addEventListener("click", () => {
    const yaEstabaVisible =
      informacion.classList.contains("visible");

    // Cierra todas las ventanas de información.
    personajes.forEach((otroPersonaje) => {
      const otraInformacion = document.getElementById(
        otroPersonaje.informacionId
      );

      if (otraInformacion) {
        otraInformacion.classList.remove("visible");
      }
    });

    // Detiene el audio anterior, si existe.
    if (audioActual) {
      audioActual.pause();
      audioActual.currentTime = 0;
      audioActual = null;
    }

    // Si estaba cerrada, la abre.
    // Si ya estaba abierta, la deja cerrada.
    if (!yaEstabaVisible) {
      informacion.classList.add("visible");

      const rutaAudio = audios[personaje.ventanaId];

      if (rutaAudio) {
        audioActual = new Audio(rutaAudio);

        audioActual.play().catch((error) => {
          console.error(
            "No se pudo reproducir el audio:",
            error
          );
        });
      }
    }
  });
});

// Carga el JSON antes de actualizar los textos.
async function iniciarPagina() {
  try {
    const respuesta = await fetch("datos.json");

    if (!respuesta.ok) {
      throw new Error(
        `Error al cargar datos.json: ${respuesta.status}`
      );
    }

    datos = await respuesta.json();

    actualizarReloj();
    actualizarContenido();

    // El reloj cambia cada segundo.
    setInterval(actualizarReloj, 1000);

    // Los textos se revisan cada minuto.
    setInterval(actualizarContenido, 1000 * 60);
  } catch (error) {
    console.error("No se pudieron cargar los datos:", error);
  }
}

iniciarPagina();