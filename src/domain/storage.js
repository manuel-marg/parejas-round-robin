/**
 * Capa de persistencia local usando localStorage y utilidades de exportación/resumen.
 */

export const ACTIVE_TOURNAMENT_KEY = 'pickleball_rr_active_v1';
export const HISTORY_KEY = 'pickleball_rr_history_v1';

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
 * Formatea la tabla de posiciones y resultados en texto limpio para compartir por WhatsApp.
 */
export function formatShareableSummary(tournament, standings) {
  const title = tournament?.title?.trim() || 'Torneo Round-Robin';
  const lines = [`*${title}*`, ''];
  lines.push('🏆 *Posiciones:*');
  standings.forEach((row) => {
    const sign = row.pointDiff > 0 ? `+${row.pointDiff}` : `${row.pointDiff}`;
    lines.push(
      `${row.rank}. ${row.name} — ${row.won}G/${row.lost}P (${row.winRate.toFixed(0)}%) | Dif ${sign} | Prom ${row.avgPointsFor.toFixed(1)} pts`
    );
  });

  const pairMap = new Map((tournament?.pairs || []).map((p) => [p.id, p.name]));
  const played = (tournament?.matches || []).filter(
    (m) => typeof m.scoreA === 'number' && typeof m.scoreB === 'number'
  );

  if (played.length > 0) {
    lines.push('', '🎾 *Marcadores:*');
    played.forEach((m) => {
      const nameA = pairMap.get(m.pairAId) || m.pairAId;
      const nameB = pairMap.get(m.pairBId) || m.pairBId;
      lines.push(`#${m.gameNumber}: ${nameA} ${m.scoreA} - ${m.scoreB} ${nameB}`);
    });
  }

  return lines.join('\n');
}
