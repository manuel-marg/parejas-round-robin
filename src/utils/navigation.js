/**
 * Utilidades para la gestión de historial y navegación interna en la aplicación (PWA/SPA).
 * Permite que los botones "Atrás" del navegador y los gestos/botones físicos de Android
 * naveguen correctamente entre vistas internas (menú inicial, configuración, historial, etc.)
 * en lugar de abandonar la aplicación o regresar a una web externa previa.
 */

export const PRE_TOURNAMENT_MODES = ['welcome', 'setup', 'saved'];
export const DEFAULT_PRE_TOURNAMENT_MODE = 'welcome';

export const TOURNAMENT_TABS = ['matches', 'stats', 'history'];
export const DEFAULT_TOURNAMENT_TAB = 'matches';

/**
 * Limpia y normaliza el hash de la URL.
 * Ejemplos: "#/setup" -> "setup", "#saved/" -> "saved", "" -> ""
 *
 * @param {string} [hashString='']
 * @returns {string}
 */
export function parseHash(hashString) {
  if (!hashString || typeof hashString !== 'string') return '';
  return hashString.replace(/^#\/?/, '').replace(/\/+$/, '').trim().toLowerCase();
}

/**
 * Resuelve la vista y pestaña correspondiente según el hash actual y si hay un torneo activo.
 *
 * @param {string} hashString
 * @param {boolean} hasTournament
 * @returns {{ view: string, tab: string, initialViewMode: string, isPreTournamentHash: boolean }}
 */
export function resolveNavFromHash(hashString, hasTournament) {
  const clean = parseHash(hashString);
  const isPreTournamentHash = PRE_TOURNAMENT_MODES.includes(clean);

  if (hasTournament) {
    const tab = TOURNAMENT_TABS.includes(clean) ? clean : DEFAULT_TOURNAMENT_TAB;
    return {
      view: 'tournament',
      tab,
      initialViewMode: DEFAULT_PRE_TOURNAMENT_MODE,
      isPreTournamentHash,
    };
  }

  const initialViewMode = isPreTournamentHash ? clean : DEFAULT_PRE_TOURNAMENT_MODE;

  return {
    view: initialViewMode,
    tab: DEFAULT_TOURNAMENT_TAB,
    initialViewMode,
    isPreTournamentHash,
  };
}

/**
 * Sincroniza el estado inicial en window.history al arrancar la app si es necesario.
 * Usa replaceState para no empujar una entrada extra y asegurar que el estado lleve appNav: true.
 *
 * @param {boolean} hasTournament
 */
export function syncInitialHistory(hasTournament) {
  if (typeof window === 'undefined') return;

  const resolved = resolveNavFromHash(window.location.hash, hasTournament);
  const targetHash = hasTournament ? `#${resolved.tab}` : `#${resolved.initialViewMode}`;

  window.history.replaceState(
    {
      appNav: true,
      view: hasTournament ? 'tournament' : resolved.initialViewMode,
      tab: resolved.tab,
      canGoBack: false,
    },
    '',
    targetHash
  );
}

/**
 * Navega a una vista previa al torneo ('welcome', 'setup', 'saved').
 *
 * @param {string} mode
 * @param {Object} [options]
 * @param {boolean} [options.replace=false]
 */
export function pushNavView(mode, { replace = false } = {}) {
  if (typeof window === 'undefined') return;

  const validMode = PRE_TOURNAMENT_MODES.includes(mode) ? mode : DEFAULT_PRE_TOURNAMENT_MODE;
  const targetHash = `#${validMode}`;

  if (replace) {
    window.history.replaceState(
      { appNav: true, view: validMode, canGoBack: false },
      '',
      targetHash
    );
  } else {
    window.history.pushState(
      { appNav: true, view: validMode, canGoBack: true },
      '',
      targetHash
    );
  }
}

/**
 * Navega a una pestaña del torneo activo ('matches', 'stats', 'history').
 * Optimizado para que 'matches' actúe como base del torneo y evitar stacks infinitos de pestañas.
 *
 * @param {string} tab
 * @param {string} currentTab
 */
export function pushNavTab(tab, currentTab) {
  if (typeof window === 'undefined') return;

  const validTab = TOURNAMENT_TABS.includes(tab) ? tab : DEFAULT_TOURNAMENT_TAB;
  const targetHash = `#${validTab}`;

  if (validTab === currentTab) return;

  // Si volvemos a la pestaña base 'matches' y hay historial previo del tab, hacemos back()
  if (validTab === DEFAULT_TOURNAMENT_TAB && window.history.state?.canGoBack) {
    window.history.back();
    return;
  }

  // Si estamos intercambiando entre pestañas secundarias ('stats' <-> 'history')
  const isSwitchingSecondaryTabs =
    currentTab !== DEFAULT_TOURNAMENT_TAB && validTab !== DEFAULT_TOURNAMENT_TAB;

  if (isSwitchingSecondaryTabs) {
    window.history.replaceState(
      { appNav: true, view: 'tournament', tab: validTab, canGoBack: true },
      '',
      targetHash
    );
  } else {
    window.history.pushState(
      { appNav: true, view: 'tournament', tab: validTab, canGoBack: true },
      '',
      targetHash
    );
  }
}

/**
 * Sincroniza el historial al iniciar o cargar un torneo activo.
 * Reemplaza la entrada actual para que la base del torneo sea '#matches'.
 */
export function syncTournamentStart() {
  if (typeof window === 'undefined') return;
  window.history.replaceState(
    {
      appNav: true,
      view: 'tournament',
      tab: DEFAULT_TOURNAMENT_TAB,
      canGoBack: false,
    },
    '',
    `#${DEFAULT_TOURNAMENT_TAB}`
  );
}

/**
 * Acción para los botones de la interfaz "Volver al menú inicial/principal".
 * Si el usuario llegó mediante navegación interna en la app, usa history.back() para
 * mantener la pila del navegador exactamente alineada. Si llegó directamente por URL,
 * usa replaceState para volver al menú de forma segura sin salir de la web.
 *
 * @param {Function} [fallbackAction]
 */
export function goBackToWelcome(fallbackAction) {
  if (typeof window === 'undefined') {
    fallbackAction?.();
    return;
  }

  if (window.history.state?.canGoBack) {
    window.history.back();
  } else {
    pushNavView(DEFAULT_PRE_TOURNAMENT_MODE, { replace: true });
    fallbackAction?.();
  }
}
