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
        title: '🎾 Cómo crear tu torneo',
        description:
          'Te mostramos paso a paso qué llenar en esta pantalla para registrar las parejas y empezar a jugar.',
      },
    },
    {
      element: '#tour-add-pair',
      popover: {
        title: '1. Agrega parejas una por una',
        description:
          'Escribe el nombre de una pareja (ej. "Laura / Andrés") y pulsa Agregar. Puedes ir sumándolas poco a poco.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-bulk-btn',
      popover: {
        title: 'Opción rápida: pegar lista',
        description:
          'Si ya tienes los nombres en WhatsApp o notas, pulsa aquí para pegar varias parejas de golpe (una por línea).',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#tour-pair-list',
      popover: {
        title: '2. Revisa tus parejas (mínimo 2)',
        description:
          'Aquí aparecerán conforme las agregues. Puedes editar cualquier nombre o quitarlo antes de comenzar.',
        side: 'top',
        align: 'center',
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
          'Deja 1 cancha (con descansos automáticos) o elige más si tienen disponibles, y selecciona a cuántos puntos juegan (11, 15 o 21).',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-generate-btn',
      popover: {
        title: '5. ¡Genera los partidos!',
        description:
          'Cuando registres al menos 2 parejas, pulsa aquí para crear automáticamente todos los juegos todos contra todos.',
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
          'Aquí ves qué partido se juega en este momento y qué parejas descansan mientras tanto.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '.match-card',
      popover: {
        title: 'Anota cada marcador',
        description:
          'Usa los botones − y + (o escribe directo) para guardar los puntos. Al llenar todos los juegos, aparecerá el botón para ver las estadísticas finales.',
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
        title: 'Tabla final y WhatsApp',
        description:
          'Entra aquí en cualquier momento para ver la tabla de posiciones y compartir los resultados por WhatsApp.',
        side: 'bottom',
        align: 'center',
      },
    },
  ];

  return runTour(steps, onComplete);
}
