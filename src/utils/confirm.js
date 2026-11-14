import Swal from 'sweetalert2';

/**
 * Diálogo de confirmación base con SweetAlert2 adaptado al diseño de Pickleball.
 *
 * @param {Object} options
 * @param {string} options.title - Título principal de la confirmación.
 * @param {string} [options.text] - Descripción explicativa.
 * @param {string} [options.html] - Contenido HTML alternativo.
 * @param {string} [options.confirmButtonText='Aceptar'] - Texto del botón de confirmación.
 * @param {string} [options.cancelButtonText='Cancelar'] - Texto del botón de cancelación.
 * @param {boolean} [options.isDanger=false] - Indica si la acción es destructiva (botón de peligro).
 * @param {'warning'|'question'|'info'|'success'|'error'} [options.icon='warning'] - Icono a mostrar.
 * @returns {Promise<boolean>} Devuelve true si el usuario confirmó, false si canceló o cerró.
 */
export async function confirmAction({
  title,
  text,
  html,
  confirmButtonText = 'Aceptar',
  cancelButtonText = 'Cancelar',
  isDanger = false,
  icon = 'warning',
}) {
  const result = await Swal.fire({
    title,
    text,
    html,
    icon,
    showCancelButton: true,
    confirmButtonColor: isDanger ? '#b91c1c' : '#0f766e',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
}

/**
 * Confirmación para crear un nuevo torneo (vuelve a la configuración de jugadores).
 */
export async function confirmNewTournament() {
  return confirmAction({
    title: '¿Crear un nuevo torneo?',
    text: 'Volverás a la pantalla de configuración. Si deseas conservar el torneo actual, asegúrate de guardarlo antes en el Historial.',
    icon: 'question',
    confirmButtonText: 'Sí, nuevo torneo',
    cancelButtonText: 'Cancelar',
    isDanger: false,
  });
}

/**
 * Confirmación para reiniciar todos los puntajes del torneo activo.
 */
export async function confirmResetScores() {
  return confirmAction({
    title: '¿Reiniciar puntajes?',
    text: 'Se borrarán todos los marcadores ingresados (incluyendo la Gran Final) y los juegos volverán a quedar pendientes.',
    icon: 'warning',
    confirmButtonText: 'Sí, reiniciar puntajes',
    cancelButtonText: 'Cancelar',
    isDanger: true,
  });
}

/**
 * Confirmación para eliminar permanentemente un torneo guardado en el historial.
 * @param {string} [title] - Título del torneo.
 */
export async function confirmDeleteHistory(title) {
  return confirmAction({
    title: '¿Eliminar del historial?',
    text: title
      ? `¿Estás seguro de que deseas eliminar "${title}"? Esta acción no se puede deshacer.`
      : '¿Estás seguro de que deseas eliminar este torneo? Esta acción no se puede deshacer.',
    icon: 'warning',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    isDanger: true,
  });
}

/**
 * Confirmación opcional para cargar un torneo guardado si ya hay partidos jugados en el torneo actual.
 * @param {string} [title] - Título del torneo que se cargará.
 */
export async function confirmLoadHistory(title) {
  return confirmAction({
    title: '¿Cargar torneo guardado?',
    text: title
      ? `Se cargará "${title}" y se reemplazará el torneo actual en curso. Si no has guardado el actual, podrías perder su progreso.`
      : 'Se reemplazará el torneo actual en curso.',
    icon: 'warning',
    confirmButtonText: 'Sí, cargar torneo',
    cancelButtonText: 'Cancelar',
    isDanger: false,
  });
}
