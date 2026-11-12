/**
 * Capa de persistencia local usando localStorage y utilidades de exportación/resumen.
 */

export const ACTIVE_TOURNAMENT_KEY = 'pickleball_rr_active_v1';
export const HISTORY_KEY = 'pickleball_rr_history_v1';
export const TUTORIAL_STATE_KEY = 'pickleball_rr_tutorial_v1';

const DEFAULT_TUTORIAL_STATE = {
  setupTourSeen: false,
  matchesTourSeen: false,
  tournamentCompleted: false,
  updatedAt: null,
};

function resolveStorage(customStorage) {
  if (customStorage) return customStorage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function safeReadJson(key, fallback, customStorage) {
  const storage = resolveStorage(customStorage);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value, customStorage) {
  const storage = resolveStorage(customStorage);
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadActiveTournament(customStorage) {
  const data = safeReadJson(ACTIVE_TOURNAMENT_KEY, null, customStorage);
  if (!data || !Array.isArray(data.pairs) || !Array.isArray(data.matches)) {
    return null;
  }
  return data;
}

export function saveActiveTournament(tournament, customStorage) {
  if (!tournament) {
    const storage = resolveStorage(customStorage);
    if (!storage) return false;
    try {
      storage.removeItem(ACTIVE_TOURNAMENT_KEY);
      return true;
    } catch {
      return false;
    }
  }
  return safeWriteJson(
    ACTIVE_TOURNAMENT_KEY,
    { ...tournament, updatedAt: new Date().toISOString() },
    customStorage
  );
}

export function loadTournamentHistory(customStorage) {
  const list = safeReadJson(HISTORY_KEY, [], customStorage);
  return Array.isArray(list) ? list : [];
}

export function saveTournamentToHistory(tournament, standings, customStorage) {
  const history = loadTournamentHistory(customStorage);
  const entry = {
    id: tournament.id || `hist-${Date.now()}`,
    title: tournament.title || 'Torneo Pickleball',
    savedAt: new Date().toISOString(),
    courts: tournament.courts || 1,
    targetPoints: tournament.targetPoints || 11,
    pairs: tournament.pairs,
    matches: tournament.matches,
    champion: standings?.[0]?.name || null,
  };
  const filtered = history.filter((item) => item.id !== entry.id);
  const next = [entry, ...filtered].slice(0, 20);
  safeWriteJson(HISTORY_KEY, next, customStorage);
  return next;
}

export function deleteHistoryEntry(entryId, customStorage) {
  const history = loadTournamentHistory(customStorage);
  const next = history.filter((item) => item.id !== entryId);
  safeWriteJson(HISTORY_KEY, next, customStorage);
  return next;
}

/**
 * Lee el estado del tutorial y si el usuario ya completó algún torneo completo.
 */
export function loadTutorialState(customStorage) {
  const data = safeReadJson(TUTORIAL_STATE_KEY, null, customStorage);
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_TUTORIAL_STATE };
  }
  return {
    setupTourSeen: Boolean(data.setupTourSeen),
    matchesTourSeen: Boolean(data.matchesTourSeen),
    tournamentCompleted: Boolean(data.tournamentCompleted),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
  };
}

export function updateTutorialState(patch, customStorage) {
  const current = loadTutorialState(customStorage);
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  safeWriteJson(TUTORIAL_STATE_KEY, next, customStorage);
  return next;
}

export function markSetupTourSeen(customStorage) {
  return updateTutorialState({ setupTourSeen: true }, customStorage);
}

export function markMatchesTourSeen(customStorage) {
  return updateTutorialState({ matchesTourSeen: true }, customStorage);
}

export function markTournamentCompleted(customStorage) {
  return updateTutorialState(
    {
      setupTourSeen: true,
      matchesTourSeen: true,
      tournamentCompleted: true,
    },
    customStorage
  );
}

export function shouldAutoStartSetupTour(tutorialState) {
  return !tutorialState?.setupTourSeen && !tutorialState?.tournamentCompleted;
}

export function shouldAutoStartMatchesTour(tutorialState) {
  return !tutorialState?.matchesTourSeen && !tutorialState?.tournamentCompleted;
}

/**
 * Valida y normaliza un respaldo JSON importado por el usuario.
 */
export function parseImportedTournament(rawText) {
  const parsed = JSON.parse(rawText);
  if (
    !parsed ||
    !Array.isArray(parsed.pairs) ||
    parsed.pairs.length < 2 ||
    !Array.isArray(parsed.matches) ||
    parsed.matches.length === 0
  ) {
    throw new Error('El archivo no contiene un torneo válido.');
  }
  return {
    id: parsed.id || `imp-${Date.now()}`,
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Torneo importado',
    courts: Number(parsed.courts) || 1,
    targetPoints: Number(parsed.targetPoints) || 11,
    pairs: parsed.pairs,
    matches: parsed.matches,
    meta: parsed.meta || null,
  };
}

/**
 * Formatea la tabla de posiciones en una lista precisa lista para enviar por WhatsApp.
 */
export function formatShareableSummary(tournament, standings) {
  const title = tournament?.title?.trim() || 'Torneo Round-Robin';
  const lines = [`*${title}*`, ''];

  standings.forEach((row) => {
    const wonLabel = row.won === 1 ? '1 ganado' : `${row.won} ganados`;
    const lostLabel = row.lost === 1 ? '1 perdido' : `${row.lost} perdidos`;
    const tiedPart =
      row.tied > 0
        ? `, ${row.tied === 1 ? '1 empatado' : `${row.tied} empatados`}`
        : '';
    lines.push(`${row.rank}. ${row.name} — ${wonLabel}, ${lostLabel}${tiedPart}`);
  });

  return lines.join('\n');
}
