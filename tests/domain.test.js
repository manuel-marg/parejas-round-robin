import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMixedMatchCount,
  generateMixedRoundRobinSchedule,
} from '../src/domain/scheduler.js';
import {
  computeIndividualStandings,
  computeSummary,
  isMatchCompleted,
  resolveFinalMatch,
} from '../src/domain/stats.js';
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

function makePlayers(womenCount, menCount) {
  const women = Array.from({ length: womenCount }, (_, i) => ({
    id: `M${i + 1}`,
    name: `Mujer ${i + 1}`,
    gender: 'M',
  }));
  const men = Array.from({ length: menCount }, (_, i) => ({
    id: `H${i + 1}`,
    name: `Hombre ${i + 1}`,
    gender: 'H',
  }));
  return [...women, ...men];
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('generateMixedRoundRobinSchedule genera la estructura exacta de 8 partidos para 4 mujeres y 4 hombres', () => {
  const players = makePlayers(4, 4);
  const { matches, meta } = generateMixedRoundRobinSchedule(players, { courts: 1 });

  assert.equal(matches.length, 8);
  assert.equal(meta.totalSlots, 8);
  assert.deepEqual(
    matches.map((m) => [
      [m.teamA.manId, m.teamA.womanId],
      [m.teamB.manId, m.teamB.womanId],
    ]),
    [
      [['H1', 'M1'], ['H2', 'M2']],
      [['H3', 'M3'], ['H4', 'M4']],
      [['H1', 'M2'], ['H3', 'M4']],
      [['H2', 'M1'], ['H4', 'M3']],
      [['H1', 'M3'], ['H4', 'M2']],
      [['H2', 'M4'], ['H3', 'M1']],
      [['H1', 'M4'], ['H3', 'M2']],
      [['H2', 'M3'], ['H4', 'M1']],
    ]
  );

  // Nadie repite pareja y todos juegan exactamente 4 partidos
  const partnerPairs = new Set();
  const gameCounts = new Map(players.map((p) => [p.id, 0]));
  for (const m of matches) {
    partnerPairs.add(`${m.teamA.manId}-${m.teamA.womanId}`);
    partnerPairs.add(`${m.teamB.manId}-${m.teamB.womanId}`);
    for (const pid of [m.teamA.manId, m.teamA.womanId, m.teamB.manId, m.teamB.womanId]) {
      gameCounts.set(pid, gameCounts.get(pid) + 1);
    }
  }
  assert.equal(partnerPairs.size, 16);
  for (const count of gameCounts.values()) {
    assert.equal(count, 4);
  }
  assert.deepEqual(matches[0].restingIds, ['M3', 'M4', 'H3', 'H4']);
});

test('generateMixedRoundRobinSchedule soporta 2 canchas simultáneas en 4M+4H sin conflictos', () => {
  const players = makePlayers(4, 4);
  const { matches, meta } = generateMixedRoundRobinSchedule(players, { courts: 2 });

  assert.equal(matches.length, 8);
  assert.equal(meta.courts, 2);
  assert.equal(meta.totalSlots, 4);

  const bySlot = new Map();
  for (const m of matches) {
    assert.equal(m.restingIds.length, 0);
    if (!bySlot.has(m.slot)) bySlot.set(m.slot, []);
    bySlot.get(m.slot).push(m);
  }
  for (const [, slotMatches] of bySlot) {
    const participants = slotMatches.flatMap((m) => [
      m.teamA.manId,
      m.teamA.womanId,
      m.teamB.manId,
      m.teamB.womanId,
    ]);
    assert.equal(new Set(participants).size, 8);
  }
});

test('generateMixedRoundRobinSchedule cubre todas las parejas y equilibra juegos para otros tamaños', () => {
  const cases = [
    [2, 2],
    [3, 3],
    [3, 4],
    [4, 5],
    [5, 5],
    [6, 6],
  ];

  for (const [w, h] of cases) {
    const players = makePlayers(w, h);
    const expectedCount = computeMixedMatchCount(h, w);
    const { matches } = generateMixedRoundRobinSchedule(players, { courts: 2 });
    assert.equal(matches.length, expectedCount, `Conteo inesperado para ${w}M+${h}H`);

    const uniquePairs = new Set();
    const gamesByPlayer = new Map(players.map((p) => [p.id, 0]));
    const bySlot = new Map();

    for (const m of matches) {
      assert.notEqual(m.teamA.manId, m.teamB.manId);
      assert.notEqual(m.teamA.womanId, m.teamB.womanId);
      uniquePairs.add(`${m.teamA.manId}-${m.teamA.womanId}`);
      uniquePairs.add(`${m.teamB.manId}-${m.teamB.womanId}`);

      for (const pid of [m.teamA.manId, m.teamA.womanId, m.teamB.manId, m.teamB.womanId]) {
        gamesByPlayer.set(pid, gamesByPlayer.get(pid) + 1);
      }

      if (!bySlot.has(m.slot)) bySlot.set(m.slot, []);
      bySlot.get(m.slot).push(m);
    }

    assert.equal(uniquePairs.size, w * h, `Todas las combinaciones M×H deben cubrirse en ${w}M+${h}H`);

    const womenGames = new Set(
      players.filter((p) => p.gender === 'M').map((p) => gamesByPlayer.get(p.id))
    );
    const menGames = new Set(
      players.filter((p) => p.gender === 'H').map((p) => gamesByPlayer.get(p.id))
    );
    assert.equal(womenGames.size, 1, `Todas las mujeres deben jugar igual en ${w}M+${h}H`);
    assert.equal(menGames.size, 1, `Todos los hombres deben jugar igual en ${w}M+${h}H`);

    for (const [, slotMatches] of bySlot) {
      const ids = slotMatches.flatMap((m) => [
        m.teamA.manId,
        m.teamA.womanId,
        m.teamB.manId,
        m.teamB.womanId,
      ]);
      assert.equal(new Set(ids).size, ids.length, `Sin duplicados en turno para ${w}M+${h}H`);
    }
  }
});

test('generateMixedRoundRobinSchedule valida mínimo 2 mujeres y 2 hombres', () => {
  assert.throws(
    () => generateMixedRoundRobinSchedule(makePlayers(1, 4)),
    /al menos 2 mujeres y 2 hombres/i
  );
  assert.throws(
    () => generateMixedRoundRobinSchedule(makePlayers(4, 1)),
    /al menos 2 mujeres y 2 hombres/i
  );
});

test('computeIndividualStandings y resolveFinalMatch calculan promedios separados y arman la Gran Final', () => {
  const players = makePlayers(4, 4);
  const { matches } = generateMixedRoundRobinSchedule(players, { courts: 1 });

  // Simulamos marcadores donde H1, H2, M1 y M2 destacan
  const scores = [
    [11, 5], // P1: H1+M1 ganan a H2+M2
    [11, 8], // P2: H3+M3 ganan a H4+M4
    [11, 3], // P3: H1+M2 ganan a H3+M4
    [11, 4], // P4: H2+M1 ganan a H4+M3
    [11, 9], // P5: H1+M3 ganan a H4+M2
    [11, 6], // P6: H2+M4 ganan a H3+M1
    [11, 7], // P7: H1+M4 ganan a H3+M2
    [11, 5], // P8: H2+M3 ganan a H4+M1
  ];

  const completed = matches.map((m, idx) => ({
    ...m,
    scoreA: scores[idx][0],
    scoreB: scores[idx][1],
  }));

  assert.equal(isMatchCompleted(completed[0]), true);
  assert.equal(isMatchCompleted({ scoreA: 11, scoreB: null }), false);

  const standings = computeIndividualStandings(players, completed);
  assert.equal(standings.women.length, 4);
  assert.equal(standings.men.length, 4);

  // H1 ganó sus 4 partidos: 44 PF, 24 PC, Dif +20, Prom 11.0
  assert.equal(standings.men[0].playerId, 'H1');
  assert.equal(standings.men[0].won, 4);
  assert.equal(standings.men[0].avgPointsFor, 11);
  assert.equal(standings.men[0].pointDiff, 20);
  // H2 ganó 3 de 4 (perdió solo P1 5-11)
  assert.equal(standings.men[1].playerId, 'H2');
  assert.equal(standings.men[1].won, 3);

  // M3 ganó 3 (P2, P5, P8), M1 ganó 2 con Dif +2, M4 ganó 2 con Dif -2, M2 ganó 1
  assert.equal(standings.women[0].playerId, 'M3');
  assert.equal(standings.women[0].won, 3);
  assert.equal(standings.women[1].playerId, 'M1');
  assert.equal(standings.women[1].won, 2);

  const summary = computeSummary(standings, completed, { pairingMode: 'crossed', scoreA: 11, scoreB: 9 });
  assert.equal(summary.isFinished, true);
  assert.equal(summary.isFinalCompleted, true);

  const finalCrossed = resolveFinalMatch(standings, {
    pairingMode: 'crossed',
    scoreA: 11,
    scoreB: 9,
  });
  assert.equal(finalCrossed.teamA.man.playerId, 'H1');
  assert.equal(finalCrossed.teamA.woman.playerId, 'M1');
  assert.equal(finalCrossed.teamB.man.playerId, 'H2');
  assert.equal(finalCrossed.teamB.woman.playerId, 'M3');
  assert.equal(finalCrossed.winnerSide, 'A');

  const finalSeeded = resolveFinalMatch(standings, {
    pairingMode: 'seeded',
    scoreA: 8,
    scoreB: 11,
  });
  assert.equal(finalSeeded.teamA.man.playerId, 'H1');
  assert.equal(finalSeeded.teamA.woman.playerId, 'M3');
  assert.equal(finalSeeded.teamB.man.playerId, 'H2');
  assert.equal(finalSeeded.teamB.woman.playerId, 'M1');
  assert.equal(finalSeeded.winnerSide, 'B');
});

test('storage guarda y recupera torneo mixto, ignora formato antiguo, y formatea resumen WhatsApp (mujeres primero)', () => {
  const storage = createMemoryStorage();
  const players = makePlayers(4, 4);
  const { matches, meta } = generateMixedRoundRobinSchedule(players, { courts: 1 });
  matches[0].scoreA = 11;
  matches[0].scoreB = 7;

  const tournament = {
    id: 'torneo-mixto-1',
    title: 'Domingo Mixto',
    courts: 1,
    targetPoints: 11,
    players,
    matches,
    finalMatch: { pairingMode: 'crossed', scoreA: 11, scoreB: 6 },
    meta,
  };

  assert.equal(saveActiveTournament(tournament, storage), true);
  const loaded = loadActiveTournament(storage);
  assert.equal(loaded.title, 'Domingo Mixto');
  assert.equal(loaded.players.length, 8);
  assert.equal(loaded.matches[0].scoreA, 11);

  const standings = computeIndividualStandings(players, matches);
  const finalResolved = resolveFinalMatch(standings, tournament.finalMatch);
  saveTournamentToHistory(tournament, standings, finalResolved, storage);
  const history = loadTournamentHistory(storage);
  assert.equal(history.length, 1);

  const parsed = parseImportedTournament(JSON.stringify(loaded));
  assert.equal(parsed.players.length, 8);

  const text = formatShareableSummary(tournament, standings, finalResolved);
  assert.match(text, /Domingo Mixto/);
  const womenPos = text.indexOf('*Mujeres*');
  const menPos = text.indexOf('*Hombres*');
  const finalPos = text.indexOf('*Gran Final*');
  assert.ok(womenPos !== -1 && menPos !== -1 && womenPos < menPos);
  assert.ok(finalPos > menPos);

  const afterDelete = deleteHistoryEntry('torneo-mixto-1', storage);
  assert.equal(afterDelete.length, 0);

  // Torneo antiguo por parejas fijas se ignora limpiamente
  storage.setItem(
    'pickleball_rr_active_v1',
    JSON.stringify({ pairs: [{ id: 'p1', name: 'A' }], matches: [{ pairAId: 'p1' }] })
  );
  assert.equal(loadActiveTournament(storage), null);
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
