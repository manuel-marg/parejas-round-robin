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
  closeBtnLabel: 'Cerrar guía',
  popoverClass: 'pickleball-popover',
};

function runTour(steps, onComplete) {
  const driverObj = driver({
    ...BASE_DRIVER_CONFIG,
    steps,
    onDestroyed: (_element, _step, opts) => {
      if (opts?.reason !== 'api' && opts?.reason !== 'replaced') {
        onComplete?.(opts?.reason);
      }
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
 * Inicia una guía breve la primera vez que el usuario entra a registrar marcadores.
 */
export function startMatchesTutorial({ onComplete } = {}) {
  const steps = [
    {
      element: '#tour-current-court',
      popover: {
        title: 'En cancha ahora',
        description:
          'Aquí ves qué parejas mixtas juegan en este momento y qué personas descansan mientras tanto.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.match-card',
      popover: {
        title: 'Anota cada marcador',
        description:
          'Usa los botones − y + (o escribe directo) para guardar los puntos. Al llenar todos los juegos se habilitará la Gran Final.',
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
