/**
 * Motor de programación Round-Robin (todos contra todos) por parejas
 * optimizado para equilibrar los descansos y evitar partidos consecutivos.
 */

/**
 * Construye todas las combinaciones únicas de partidos entre N parejas.
 * @param {Array<{ id: string, name: string }>} pairs
 * @returns {Array<[number, number]>} Índices [i, j] de cada enfrentamiento.
 */
function buildAllPairings(pairs) {
  const pairings = [];
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      pairings.push([i, j]);
    }
  }
  return pairings;
}

/**
 * Calcula una puntuación heurística para priorizar partidos cuyos participantes
 * llevan más tiempo descansando y menos juegos acumulados.
 */
function scoreCandidate(a, b, slotIdx, playedCount, lastSlot) {
  const restA = slotIdx - lastSlot[a];
  const restB = slotIdx - lastSlot[b];
  const backToBackPenalty = (restA === 1 ? -1000 : 0) + (restB === 1 ? -1000 : 0);
  const fairnessWeight = -(playedCount[a] + playedCount[b]) * 50;
  const restBalance = Math.min(restA, restB) * 20 + (restA + restB);
  return backToBackPenalty + fairnessWeight + restBalance;
}

/**
 * Intenta encontrar una secuencia completa sin partidos consecutivos para 1 cancha
 * cuando existen al menos 5 parejas, respetando el balance de descansos.
 */
function solveZeroBackToBackSingleCourt(pairCount, allPairings) {
  const total = allPairings.length;
  const used = new Array(total).fill(false);
  const playedCount = new Array(pairCount).fill(0);
  const lastSlot = new Array(pairCount).fill(-10);
  const order = new Array(total);
  let steps = 0;
  const MAX_STEPS = 5000;

  function dfs(slotIdx, prevA, prevB) {
    if (slotIdx === total) return true;
    if (steps >= MAX_STEPS) return false;
    steps++;

    const candidates = [];
    for (let idx = 0; idx < total; idx++) {
      if (used[idx]) continue;
      const [a, b] = allPairings[idx];
      if (a === prevA || a === prevB || b === prevA || b === prevB) continue;
      candidates.push({
        idx,
        a,
        b,
        score: scoreCandidate(a, b, slotIdx, playedCount, lastSlot),
      });
    }

    candidates.sort((x, y) => y.score - x.score || x.idx - y.idx);

    for (const cand of candidates) {
      used[cand.idx] = true;
      const prevLastA = lastSlot[cand.a];
      const prevLastB = lastSlot[cand.b];
      playedCount[cand.a]++;
      playedCount[cand.b]++;
      lastSlot[cand.a] = slotIdx;
      lastSlot[cand.b] = slotIdx;
      order[slotIdx] = allPairings[cand.idx];

      if (dfs(slotIdx + 1, cand.a, cand.b)) return true;

      used[cand.idx] = false;
      playedCount[cand.a]--;
      playedCount[cand.b]--;
      lastSlot[cand.a] = prevLastA;
      lastSlot[cand.b] = prevLastB;
    }

    return false;
  }

  return dfs(0, -1, -1) ? order : null;
}

/**
 * Programa partidos en turnos secuenciales por cancha con heurística de descanso.
 */
function scheduleSlotsGreedy(pairCount, allPairings, courts) {
  const remaining = [...allPairings];
  const playedCount = new Array(pairCount).fill(0);
  const lastSlot = new Array(pairCount).fill(-10);
  const slots = [];
  let slotIdx = 0;

  while (remaining.length > 0) {
    const busyInSlot = new Set();
    const slotMatches = [];

    for (let c = 0; c < courts && remaining.length > 0; c++) {
      let bestIdx = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const [a, b] = remaining[i];
        if (busyInSlot.has(a) || busyInSlot.has(b)) continue;

        const score = scoreCandidate(a, b, slotIdx, playedCount, lastSlot);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) break;
      const [chosen] = remaining.splice(bestIdx, 1);
      slotMatches.push(chosen);
      busyInSlot.add(chosen[0]);
      busyInSlot.add(chosen[1]);
    }

    if (slotMatches.length === 0) break;

    for (const [a, b] of slotMatches) {
      playedCount[a]++;
      playedCount[b]++;
      lastSlot[a] = slotIdx;
      lastSlot[b] = slotIdx;
    }

    slots.push(slotMatches);
    slotIdx++;
  }

  return slots;
}

/**
 * Cuenta cuántos cruces consecutivos (una pareja jugando dos turnos seguidos) ocurren.
 */
function countBackToBackTransitions(slots) {
  let transitions = 0;
  let prevPairs = new Set();

  for (const slotMatches of slots) {
    const currentPairs = new Set();
    for (const [a, b] of slotMatches) {
      if (prevPairs.has(a)) transitions++;
      if (prevPairs.has(b)) transitions++;
      currentPairs.add(a);
      currentPairs.add(b);
    }
    prevPairs = currentPairs;
  }

  return transitions;
}

/**
 * Genera el calendario completo todos contra todos para una lista de parejas.
 * @param {Array<{ id: string, name: string }>} pairs
 * @param {{ courts?: number }} [options]
 */
export function generateRoundRobinSchedule(pairs, options = {}) {
  if (!Array.isArray(pairs) || pairs.length < 2) {
    throw new Error('Se necesitan al menos 2 parejas para generar un torneo todos contra todos.');
  }

  const pairCount = pairs.length;
  const maxUsefulCourts = Math.max(1, Math.floor(pairCount / 2));
  const requestedCourts = Number.isFinite(Number(options.courts))
    ? Math.trunc(Number(options.courts))
    : 1;
  const effectiveCourts = Math.min(Math.max(1, requestedCourts), maxUsefulCourts);

  const allPairings = buildAllPairings(pairs);

  let slots;
  if (effectiveCourts === 1 && pairCount >= 5 && pairCount <= 16) {
    const perfectOrder = solveZeroBackToBackSingleCourt(pairCount, allPairings);
    slots = perfectOrder
      ? perfectOrder.map((match) => [match])
      : scheduleSlotsGreedy(pairCount, allPairings, 1);
  } else {
    slots = scheduleSlotsGreedy(pairCount, allPairings, effectiveCourts);
  }

  const matches = [];
  let gameCounter = 1;

  slots.forEach((slotMatches, slotIndex) => {
    const activePairIndices = new Set();
    slotMatches.forEach(([a, b]) => {
      activePairIndices.add(a);
      activePairIndices.add(b);
    });

    const restingIds = [];
    for (let i = 0; i < pairCount; i++) {
      if (!activePairIndices.has(i)) {
        restingIds.push(pairs[i].id);
      }
    }

    slotMatches.forEach(([aIdx, bIdx], courtIdx) => {
      matches.push({
        id: `game-${gameCounter}`,
        gameNumber: gameCounter,
        slot: slotIndex + 1,
        court: courtIdx + 1,
        pairAId: pairs[aIdx].id,
        pairBId: pairs[bIdx].id,
        restingIds,
        scoreA: null,
        scoreB: null,
      });
      gameCounter++;
    });
  });

  return {
    matches,
    meta: {
      totalMatches: matches.length,
      totalSlots: slots.length,
      courts: effectiveCourts,
      backToBackTransitions: countBackToBackTransitions(slots),
    },
  };
}
