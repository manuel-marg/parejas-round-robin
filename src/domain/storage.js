/**
 * Capa de persistencia local usando localStorage y utilidades de exportación/resumen.
 */

export const ACTIVE_TOURNAMENT_KEY = 'pickleball_rr_active_v1';
export const HISTORY_KEY = 'pickleball_rr_history_v1';
export const TUTORIAL_STATE_KEY = 'pickleball_rr_tutorial_v1';

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_TUTORIAL_STATE = {
  setupTourSeen: false,
  matchesTourSeen: false,
  statsTourSeen: false,
  historyTourSeen: false,
  tournamentCompleted: false,
  helpRequestedDate: null,
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

export function isValidMixedTournament(data) {
  return Boolean(
    data &&
      Array.isArray(data.players) &&
      data.players.length >= 4 &&
      Array.isArray(data.matches) &&
      data.matches.length > 0 &&
      data.matches[0]?.teamA &&
      data.matches[0]?.teamB
  );
}

export function loadActiveTournament(customStorage) {
  const data = safeReadJson(ACTIVE_TOURNAMENT_KEY, null, customStorage);
  if (!isValidMixedTournament(data)) {
    return null;
  }
  return {
    ...data,
    finalMatch: data.finalMatch || { pairingMode: 'crossed', scoreA: null, scoreB: null },
  };
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
  if (!Array.isArray(list)) return [];
  return list.filter(isValidMixedTournament);
}

export function saveTournamentToHistory(tournament, standings, finalMatchResolved, customStorage) {
  const history = loadTournamentHistory(customStorage);
  const topWoman = standings?.women?.[0]?.name || null;
  const topMan = standings?.men?.[0]?.name || null;
  let championLabel = null;

  if (finalMatchResolved?.completed) {
    if (finalMatchResolved.winnerSide === 'A') {
      championLabel = `${finalMatchResolved.teamA.man.name} + ${finalMatchResolved.teamA.woman.name}`;
    } else if (finalMatchResolved.winnerSide === 'B') {
      championLabel = `${finalMatchResolved.teamB.man.name} + ${finalMatchResolved.teamB.woman.name}`;
    }
  } else if (topWoman && topMan) {
    championLabel = `${topWoman} / ${topMan}`;
  }

  const entry = {
    id: tournament.id || `hist-${Date.now()}`,
    title: tournament.title || 'Torneo Pickleball',
    savedAt: new Date().toISOString(),
    courts: tournament.courts || 1,
    targetPoints: tournament.targetPoints || 11,
    players: tournament.players,
    matches: tournament.matches,
    finalMatch: tournament.finalMatch || { pairingMode: 'crossed', scoreA: null, scoreB: null },
    meta: tournament.meta || null,
    champion: championLabel,
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
    statsTourSeen: Boolean(data.statsTourSeen),
    historyTourSeen: Boolean(data.historyTourSeen),
    tournamentCompleted: Boolean(data.tournamentCompleted),
    helpRequestedDate: typeof data.helpRequestedDate === 'string' ? data.helpRequestedDate : null,
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

export function activateHelpSession(customStorage) {
  const today = getTodayDateString();
  return updateTutorialState(
    {
      helpRequestedDate: today,
      setupTourSeen: false,
      matchesTourSeen: false,
      statsTourSeen: false,
      historyTourSeen: false,
    },
    customStorage
  );
}

export function markSetupTourSeen(customStorage) {
  return updateTutorialState({ setupTourSeen: true }, customStorage);
}

export function markMatchesTourSeen(customStorage) {
  return updateTutorialState({ matchesTourSeen: true }, customStorage);
}

export function markStatsTourSeen(customStorage) {
  return updateTutorialState({ statsTourSeen: true }, customStorage);
}

export function markHistoryTourSeen(customStorage) {
  return updateTutorialState({ historyTourSeen: true }, customStorage);
}

export function markTournamentCompleted(customStorage) {
  return updateTutorialState(
    {
      setupTourSeen: true,
      matchesTourSeen: true,
      statsTourSeen: true,
      historyTourSeen: true,
      tournamentCompleted: true,
    },
    customStorage
  );
}

export function isHelpActiveForToday(tutorialState) {
  return Boolean(
    tutorialState?.helpRequestedDate &&
    tutorialState.helpRequestedDate === getTodayDateString()
  );
}

export function shouldAutoStartSetupTour(tutorialState) {
  if (tutorialState?.tournamentCompleted) return false;
  if (tutorialState?.setupTourSeen) return false;
  return isHelpActiveForToday(tutorialState) || !tutorialState?.helpRequestedDate;
}

export function shouldAutoStartMatchesTour(tutorialState) {
  if (tutorialState?.tournamentCompleted) return false;
  if (tutorialState?.matchesTourSeen) return false;
  return isHelpActiveForToday(tutorialState) || !tutorialState?.helpRequestedDate;
}

export function shouldAutoStartStatsTour(tutorialState) {
  if (tutorialState?.statsTourSeen) return false;
  return isHelpActiveForToday(tutorialState);
}

export function shouldAutoStartHistoryTour(tutorialState) {
  if (tutorialState?.historyTourSeen) return false;
  return isHelpActiveForToday(tutorialState);
}

/**
 * Valida y normaliza un respaldo JSON importado por el usuario.
 */
export function parseImportedTournament(rawText) {
  const parsed = JSON.parse(rawText);
  if (!isValidMixedTournament(parsed)) {
    throw new Error('El archivo no contiene un torneo válido.');
  }
  return {
    id: parsed.id || `imp-${Date.now()}`,
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Torneo importado',
    courts: Number(parsed.courts) || 1,
    targetPoints: Number(parsed.targetPoints) || 11,
    players: parsed.players,
    matches: parsed.matches,
    finalMatch: parsed.finalMatch || { pairingMode: 'crossed', scoreA: null, scoreB: null },
    meta: parsed.meta || null,
  };
}

function formatStandingLine(row) {
  const wonLabel = row.won === 1 ? '1 ganado' : `${row.won} ganados`;
  const lostLabel = row.lost === 1 ? '1 perdido' : `${row.lost} perdidos`;
  const tiedPart =
    row.tied > 0
      ? `, ${row.tied === 1 ? '1 empatado' : `${row.tied} empatados`}`
      : '';
  return `${row.rank}. ${row.name} — ${wonLabel}, ${lostLabel}${tiedPart}`;
}

/**
 * Formatea los promedios individuales (mujeres primero y luego hombres) y la Gran Final
 * en una lista precisa lista para enviar por WhatsApp.
 */
export function formatShareableSummary(tournament, standings, finalMatchResolved) {
  const title = tournament?.title?.trim() || 'Torneo de Pickleball';
  const lines = [`*${title}*`, ''];

  lines.push('*Mujeres*');
  (standings?.women || []).forEach((row) => {
    lines.push(formatStandingLine(row));
  });

  lines.push('');
  lines.push('*Hombres*');
  (standings?.men || []).forEach((row) => {
    lines.push(formatStandingLine(row));
  });

  if (finalMatchResolved?.completed) {
    const teamALabel = `${finalMatchResolved.teamA.man.name} + ${finalMatchResolved.teamA.woman.name}`;
    const teamBLabel = `${finalMatchResolved.teamB.man.name} + ${finalMatchResolved.teamB.woman.name}`;
    lines.push('');
    lines.push('*Gran Final*');
    lines.push(`${teamALabel} (${finalMatchResolved.scoreA}) vs (${finalMatchResolved.scoreB}) ${teamBLabel}`);
    if (finalMatchResolved.winnerSide === 'A') {
      lines.push(`Campeones: ${teamALabel}`);
    } else if (finalMatchResolved.winnerSide === 'B') {
      lines.push(`Campeones: ${teamBLabel}`);
    } else {
      lines.push('Resultado: Empate');
    }
  }

  return lines.join('\n');
}
