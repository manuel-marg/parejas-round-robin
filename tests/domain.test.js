import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoundRobinSchedule } from '../src/domain/scheduler.js';
import { computeStandings, computeSummary, isMatchCompleted } from '../src/domain/stats.js';
import {
  loadActiveTournament,
  saveActiveTournament,
  saveTournamentToHistory,
  loadTournamentHistory,
  deleteHistoryEntry,
  parseImportedTournament,
  formatShareableSummary,
  loadTutorialState,
  markSetupTourSeen,
  markMatchesTourSeen,
  markTournamentCompleted,
  shouldAutoStartSetupTour,
  shouldAutoStartMatchesTour,
} from '../src/domain/storage.js';

function makePairs(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Pareja ${i + 1}`,
  }));
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('generateRoundRobinSchedule genera el orden alternado exacto para 4 parejas en 1 cancha', () => {
  const pairs = makePairs(4);
  const { matches, meta } = generateRoundRobinSchedule(pairs, { courts: 1 });

  assert.equal(matches.length, 6);
  assert.equal(meta.totalSlots, 6);
  assert.deepEqual(
    matches.map((m) => [m.pairAId, m.pairBId]),
    [
      ['p1', 'p2'],
      ['p3', 'p4'],
      ['p1', 'p3'],
      ['p2', 'p4'],
      ['p1', 'p4'],
      ['p2', 'p3'],
    ]
  );
  assert.deepEqual(matches[0].restingIds, ['p3', 'p4']);
  assert.deepEqual(matches[1].restingIds, ['p1', 'p2']);
});

test('generateRoundRobinSchedule garantiza 0 juegos seguidos en 1 cancha para N=5..10', () => {
  for (let n = 5; n <= 10; n++) {
    const pairs = makePairs(n);
    const { matches, meta } = generateRoundRobinSchedule(pairs, { courts: 1 });
    const expectedCount = (n * (n - 1)) / 2;

    assert.equal(matches.length, expectedCount);
    assert.equal(meta.backToBackTransitions, 0, `Se esperaban 0 cruces seguidos para N=${n}`);

    const uniqueKeys = new Set(
      matches.map((m) => [m.pairAId, m.pairBId].sort().join('-'))
    );
    assert.equal(uniqueKeys.size, expectedCount, `Todas las parejas deben enfrentarse una vez para N=${n}`);
  }
});

test('generateRoundRobinSchedule soporta múltiples canchas simultáneas', () => {
  const pairs = makePairs(6);
  const { matches, meta } = generateRoundRobinSchedule(pairs, { courts: 2 });

  assert.equal(matches.length, 15);
  assert.equal(meta.courts, 2);

  // Ninguna pareja puede jugar dos partidos en el mismo turno (slot)
  const bySlot = new Map();
  for (const m of matches) {
    if (!bySlot.has(m.slot)) bySlot.set(m.slot, []);
    bySlot.get(m.slot).push(m);
  }
  for (const [, slotMatches] of bySlot) {
    const participants = slotMatches.flatMap((m) => [m.pairAId, m.pairBId]);
    assert.equal(new Set(participants).size, participants.length);
  }
});

test('generateRoundRobinSchedule valida mínimo 2 parejas', () => {
  assert.throws(() => generateRoundRobinSchedule(makePairs(1)), /al menos 2 parejas/i);
});

test('computeStandings y computeSummary calculan estadísticas, promedios y mayor/menor ganador', () => {
  const pairs = makePairs(4);
  const { matches } = generateRoundRobinSchedule(pairs, { courts: 1 });

  // Simulamos marcadores completos
  const scores = [
    [11, 4], // p1 vence a p2
    [11, 9], // p3 vence a p4
    [11, 6], // p1 vence a p3
    [11, 8], // p2 vence a p4
    [11, 5], // p1 vence a p4
    [7, 11], // p3 vence a p2
  ];

  const completed = matches.map((m, idx) => ({
    ...m,
    scoreA: scores[idx][0],
    scoreB: scores[idx][1],
  }));

  assert.equal(isMatchCompleted(completed[0]), true);
  assert.equal(isMatchCompleted({ scoreA: 11, scoreB: null }), false);

  const standings = computeStandings(pairs, completed);
  assert.equal(standings[0].pairId, 'p1');
  assert.equal(standings[0].won, 3);
  assert.equal(standings[0].lost, 0);
  assert.equal(standings[0].winRate, 100);
  assert.equal(standings[0].pointsFor, 33);
  assert.equal(standings[0].pointsAgainst, 15);
  assert.equal(standings[0].pointDiff, 18);
  assert.equal(standings[0].avgPointsFor, 11);

  assert.equal(standings[3].pairId, 'p4');
  assert.equal(standings[3].won, 0);
  assert.equal(standings[3].lost, 3);

  const summary = computeSummary(standings, completed);
  assert.equal(summary.isFinished, true);
  assert.equal(summary.progressPct, 100);
  assert.equal(summary.topWinners[0].pairId, 'p1');
  assert.equal(summary.lowestWinners[0].pairId, 'p4');
  assert.equal(summary.bestAttack.pairId, 'p1');
  assert.equal(summary.bestDiff.pairId, 'p1');
});

test('storage guarda y recupera torneo activo, historial, respaldo JSON y resumen', () => {
  const storage = createMemoryStorage();
  const pairs = makePairs(4);
  const { matches, meta } = generateRoundRobinSchedule(pairs, { courts: 1 });
  matches[0].scoreA = 11;
  matches[0].scoreB = 7;

  const tournament = {
    id: 'torneo-1',
    title: 'Domingo Pickleball',
    courts: 1,
    targetPoints: 11,
    pairs,
    matches,
    meta,
  };

  assert.equal(saveActiveTournament(tournament, storage), true);
  const loaded = loadActiveTournament(storage);
  assert.equal(loaded.title, 'Domingo Pickleball');
  assert.equal(loaded.matches[0].scoreA, 11);

  const standings = computeStandings(pairs, matches);
  saveTournamentToHistory(tournament, standings, storage);
  const history = loadTournamentHistory(storage);
  assert.equal(history.length, 1);
  assert.equal(history[0].champion, 'Pareja 1');

  const parsed = parseImportedTournament(JSON.stringify(loaded));
  assert.equal(parsed.pairs.length, 4);

  const text = formatShareableSummary(tournament, standings);
  assert.match(text, /Domingo Pickleball/);
  assert.match(text, /1\. Pareja 1 — 1 ganado, 0 perdidos/);
  assert.match(text, /4\. Pareja 2 — 0 ganados, 1 perdido/);

  const afterDelete = deleteHistoryEntry('torneo-1', storage);
  assert.equal(afterDelete.length, 0);
});

test('tutorialState controla primera visita y desactiva autoarranque al completar torneo', () => {
  const storage = createMemoryStorage();

  const initial = loadTutorialState(storage);
  assert.equal(initial.setupTourSeen, false);
  assert.equal(initial.matchesTourSeen, false);
  assert.equal(initial.tournamentCompleted, false);
  assert.equal(shouldAutoStartSetupTour(initial), true);
  assert.equal(shouldAutoStartMatchesTour(initial), true);

  const afterSetup = markSetupTourSeen(storage);
  assert.equal(afterSetup.setupTourSeen, true);
  assert.equal(shouldAutoStartSetupTour(afterSetup), false);
  assert.equal(shouldAutoStartMatchesTour(afterSetup), true);

  const afterMatches = markMatchesTourSeen(storage);
  assert.equal(afterMatches.matchesTourSeen, true);
  assert.equal(shouldAutoStartMatchesTour(afterMatches), false);

  const freshStorage = createMemoryStorage();
  const completed = markTournamentCompleted(freshStorage);
  assert.equal(completed.tournamentCompleted, true);
  assert.equal(shouldAutoStartSetupTour(completed), false);
  assert.equal(shouldAutoStartMatchesTour(completed), false);
});
