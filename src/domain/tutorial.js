import { driver } from 'driver.js';

const BASE_DRIVER_CONFIG = {
  animate: true,
  smoothScroll: true,
  allowClose: true,
  allowKeyboardControl: true,
  skipMissingElement: true,
  disableActiveInteraction: false,
  overlayColor: '#0f172a',
  overlayOpacity: 0.55,
  stagePadding: 8,
  stageRadius: 12,
  popoverOffset: 12,
  showProgress: true,
  progressText: '{{current}} de {{total}}',
  nextBtnText: 'Siguiente →',
  prevBtnText: '← Anterior',
  doneBtnText: '¡Listo!',
  closeBtnLabel: 'Cerrar ayuda',
  popoverClass: 'pickleball-popover',
};

function runTour(steps, onComplete) {
  let finished = false;
  const finish = (reason) => {
    if (finished) return;
    finished = true;
    try {
      onComplete?.(reason);
    } catch (err) {
      console.error('Error in tour onComplete:', err);
    }
  };

  const driverObj = driver({
    ...BASE_DRIVER_CONFIG,
    steps,
    onDestroyStarted: (_element, _step, opts) => {
      finish(opts?.reason);
    },
    onDestroyed: (_element, _step, opts) => {
      finish(opts?.reason);
    },
  });

  driverObj.drive();
  return driverObj;
}

/**
 * Inicia el tutorial interactivo de la vista inicial de configuración del torneo.
 */
export function startSetupTutorial({ onComplete } = {}) {
  const steps = [
    {
      popover: {
        title: 'Cómo crear tu torneo mixto',
        description:
          'Registra a cada persona de forma individual (mujeres y hombres). El sistema rotará las parejas en cada juego sin repetir compañero.',
      },
    },
    {
      element: '#tour-add-women',
      popover: {
        title: '1. Agrega a las mujeres',
        description:
          'Escribe el nombre de cada jugadora y pulsa Agregar. Lo ideal es registrar 4 mujeres (mínimo 2).',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-add-men',
      popover: {
        title: '2. Agrega a los hombres',
        description:
          'Escribe el nombre de cada jugador y pulsa Agregar. Con 4 mujeres y 4 hombres se generan 8 partidos (4 por persona).',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-title-field',
      popover: {
        title: '3. Nombre del torneo',
        description:
          'Personaliza el título de la jornada. Se mostrará arriba y al compartir los resultados por WhatsApp.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-match-rules',
      popover: {
        title: '4. Canchas y puntaje',
        description:
          'Elige 1 cancha (turnos secuenciales) o 2 canchas simultáneas, y selecciona el puntaje de referencia (11, 15 o 21).',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-generate-btn',
      popover: {
        title: '5. ¡Genera los partidos!',
        description:
          'Al terminar los partidos clasificatorios, las 2 mejores mujeres y los 2 mejores hombres jugarán la Gran Final.',
        side: 'top',
        align: 'center',
      },
    },
  ];

  return runTour(steps, onComplete);
}

/**
 * Inicia una guía breve para la vista de marcadores y partidos.
 */
export function startMatchesTutorial({ onComplete } = {}) {
  const steps = [
    {
      element: '#tour-current-court',
      popover: {
        title: 'En cancha ahora',
        description:
          'Aquí ves qué parejas mixtas juegan en este momento.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.matches-progress-card',
      popover: {
        title: 'Progreso hacia la Gran Final',
        description:
          'Esta barra se llena conforme anotas los puntos de cada partido. Al alcanzar el 100%, se desbloqueará la Gran Final.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '.match-card',
      popover: {
        title: 'Anota cada marcador',
        description:
          'Usa los botones − y + (o escribe directo) para guardar los puntos de cada juego.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: () => {
        const desktopTab = document.querySelector('#tour-stats-tab-desktop');
        if (desktopTab && desktopTab.offsetParent !== null) {
          return desktopTab;
        }
        return document.querySelector('#tour-stats-tab-mobile') || undefined;
      },
      popover: {
        title: 'Promedios y WhatsApp',
        description:
          'Consulta aquí los promedios individuales (mujeres primero y luego hombres), los clasificados a la final y comparte por WhatsApp.',
        side: 'bottom',
        align: 'center',
      },
    },
  ];

  return runTour(steps, onComplete);
}

/**
 * Inicia la guía interactiva para la vista de Promedios y tabla de posiciones.
 */
export function startStatsTutorial({ onComplete } = {}) {
  const steps = [
    {
      popover: {
        title: 'Vista de Promedios',
        description:
          'Aquí puedes consultar la tabla general de posiciones de mujeres y hombres, su avance y el estado de la Gran Final.',
      },
    },
    {
      element: '#tour-stats-progress',
      popover: {
        title: '1. Progreso y WhatsApp',
        description:
          'Muestra el avance de partidos completados. Usa el botón verde para compartir los resultados actualizados en tu grupo de WhatsApp.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-stats-women',
      popover: {
        title: '2. Tabla de Mujeres',
        description:
          'Lista a todas las jugadoras ordenadas por victorias, porcentaje y promedio. Al terminar la fase regular, las 2 primeras se marcarán como Finalistas.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-stats-men',
      popover: {
        title: '3. Tabla de Hombres',
        description:
          'Muestra las posiciones individuales de los hombres. Los 2 primeros lugares clasificarán oficialmente a la Gran Final.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-stats-final',
      popover: {
        title: '4. Gran Final',
        description:
          'Mientras falten partidos por jugar, verás un aviso de pendiente. Al completar el 100% de los juegos, aquí podrás definir los cruces y anotar el marcador final.',
        side: 'top',
        align: 'start',
      },
    },
  ];

  return runTour(steps, onComplete);
}

/**
 * Inicia la guía interactiva para la vista de Historial y opciones del torneo.
 */
export function startHistoryTutorial({ onComplete } = {}) {
  const steps = [
    {
      popover: {
        title: 'Historial y Opciones',
        description:
          'Aquí puedes gestionar las copias de seguridad de tus torneos, reiniciar marcadores o cargar torneos anteriores.',
      },
    },
    {
      element: '#tour-history-actions',
      popover: {
        title: '1. Acciones del torneo',
        description:
          'Guarda una copia de este torneo en el historial del dispositivo, reinicia los marcadores si desean volver a jugar, o crea un nuevo torneo desde cero.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-history-list',
      popover: {
        title: '2. Torneos guardados',
        description:
          'Lista de torneos guardados en este navegador. Pulsa "Cargar" para restaurar cualquier torneo anterior o "Eliminar" para borrarlo.',
        side: 'top',
        align: 'start',
      },
    },
  ];

  return runTour(steps, onComplete);
}
