/**
 * Motor de programación de torneos Round-Robin mixtos con parejas rotativas.
 * Cada partido enfrenta a 2 parejas mixtas (1 hombre + 1 mujer vs 1 hombre + 1 mujer)
 * rotando compañeros para que todos jueguen la misma cantidad de partidos.
 */

const PRESET_4X4_MATCHES = [
  // Partido 1: H1 + M1 vs H2 + M2
  [[0, 0], [1, 1]],
  // Partido 2: H3 + M3 vs H4 + M4
  [[2, 2], [3, 3]],
  // Partido 3: H1 + M2 vs H3 + M4
  [[0, 1], [2, 3]],
  // Partido 4: H2 + M1 vs H4 + M3
  [[1, 0], [3, 2]],
  // Partido 5: H1 + M3 vs H4 + M2
  [[0, 2], [3, 1]],
  // Partido 6: H2 + M4 vs H3 + M1
  [[1, 3], [2, 0]],
  // Partido 7: H1 + M4 vs H3 + M2
  [[0, 3], [2, 1]],
  // Partido 8: H2 + M3 vs H4 + M1
  [[1, 2], [3, 0]],
];

const PRESET_2X2_MATCHES = [
  [[0, 0], [1, 1]],
  [[0, 1], [1, 0]],
];

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

/**
 * Calcula la cantidad óptima de partidos para H hombres y M mujeres
 * cubriendo todas las combinaciones H×M y equilibrando juegos por género.
 * Opcionalmente multiplica por la cantidad de rondas (1 o 2).
 */
export function computeMixedMatchCount(menCount, womenCount, rounds = 1) {
  const effectiveRounds = Number(rounds) === 2 ? 2 : 1;
  let baseMatches;
  if (menCount === 4 && womenCount === 4) {
    baseMatches = 8;
  } else if (menCount === 2 && womenCount === 2) {
    baseMatches = 2;
  } else {
    const minAppearances = menCount * womenCount;
    const period = lcm(menCount, womenCount);
    baseMatches = Math.ceil(minAppearances / 2);
    while ((2 * baseMatches) % period !== 0) {
      baseMatches++;
    }
  }

  return baseMatches * effectiveRounds;
}

/**
 * Construye una matriz de frecuencias objetivo para cada pareja (h, m)
 * de modo que todas las combinaciones aparezcan al menos una vez y cada jugador
 * acumule exactamente su cuota de partidos.
 */
function buildPairCountsMatrix(H, M, totalMatches) {
  const totalSlots = 2 * totalMatches;
  const menQuota = totalSlots / H;
  const womenQuota = totalSlots / M;
  const base = Math.floor(totalSlots / (H * M));

  const matrix = Array.from({ length: H }, () => new Array(M).fill(base));
  const rowNeed = new Array(H).fill(menQuota - base * M);
  const colNeed = new Array(M).fill(womenQuota - base * H);

  let remaining = totalSlots - base * H * M;
  let guard = 0;
  while (remaining > 0 && guard < totalSlots * 4) {
    guard++;
    // Elegir la fila con mayor déficit y distribuir hacia las columnas con mayor déficit
    let bestH = -1;
    for (let h = 0; h < H; h++) {
      if (rowNeed[h] > 0 && (bestH === -1 || rowNeed[h] > rowNeed[bestH])) {
        bestH = h;
      }
    }
    if (bestH === -1) break;

    let bestM = -1;
    for (let m = 0; m < M; m++) {
      if (colNeed[m] <= 0) continue;
      if (
        bestM === -1 ||
        matrix[bestH][m] < matrix[bestH][bestM] ||
        (matrix[bestH][m] === matrix[bestH][bestM] && colNeed[m] > colNeed[bestM])
      ) {
        bestM = m;
      }
    }
    if (bestM === -1) break;

    matrix[bestH][bestM]++;
    rowNeed[bestH]--;
    colNeed[bestM]--;
    remaining--;
  }

  return matrix;
}

/**
 * Empareja las combinaciones (h, m) en partidos válidos sin repetir jugadores
 * dentro del mismo partido, usando búsqueda con heurística MRV.
 */
function pairIntoMatches(H, M, totalMatches) {
  const matrix = buildPairCountsMatrix(H, M, totalMatches);
  const pool = [];
  for (let h = 0; h < H; h++) {
    for (let m = 0; m < M; m++) {
      for (let c = 0; c < matrix[h][m]; c++) {
        pool.push([h, m]);
      }
    }
  }

  const used = new Array(pool.length).fill(false);
  const matches = new Array(totalMatches);
  let steps = 0;
  const MAX_STEPS = 25000;

  function solve(matchIdx) {
    if (matchIdx === totalMatches) return true;
    if (steps >= MAX_STEPS) return false;
    steps++;

    // Contar apariciones restantes por hombre y mujer para priorizar LCV
    const remH = new Array(H).fill(0);
    const remM = new Array(M).fill(0);
    for (let k = 0; k < pool.length; k++) {
      if (used[k]) continue;
      remH[pool[k][0]]++;
      remM[pool[k][1]]++;
    }

    // Elegir la pareja disponible con menos opciones compatibles (MRV)
    let firstIdx = -1;
    let minOptions = Infinity;
    let firstOptions = [];
    const checkedFirstKeys = new Set();

    for (let i = 0; i < pool.length; i++) {
      if (used[i]) continue;
      const [hA, mA] = pool[i];
      const firstKey = `${hA}-${mA}`;
      if (checkedFirstKeys.has(firstKey)) continue;
      checkedFirstKeys.add(firstKey);

      const options = [];
      const seenKeys = new Set();
      for (let j = 0; j < pool.length; j++) {
        if (j === i || used[j]) continue;
        const [hB, mB] = pool[j];
        if (hA === hB || mA === mB) continue;
        const key = `${hB}-${mB}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        options.push(j);
      }
      if (options.length === 0) return false;
      if (options.length < minOptions) {
        minOptions = options.length;
        firstIdx = i;
        firstOptions = options;
        if (minOptions === 1) break;
      }
    }

    if (firstIdx === -1) return false;

    // Ordenar opciones por mayor frecuencia restante (LCV) para evitar bloqueos finales
    firstOptions.sort((a, b) => {
      const scoreA = remH[pool[a][0]] + remM[pool[a][1]];
      const scoreB = remH[pool[b][0]] + remM[pool[b][1]];
      return scoreB - scoreA;
    });

    used[firstIdx] = true;
    for (const secondIdx of firstOptions) {
      used[secondIdx] = true;
      matches[matchIdx] = [pool[firstIdx], pool[secondIdx]];
      if (solve(matchIdx + 1)) return true;
      used[secondIdx] = false;
    }
    used[firstIdx] = false;

    return false;
  }

  if (solve(0)) {
    return matches;
  }

  // Respaldo constructivo si la búsqueda excede el límite en tamaños muy grandes
  throw new Error('No se pudo construir un rol válido para esa combinación de jugadores.');
}

function getMatchPlayerKeys([teamA, teamB]) {
  return [`H${teamA[0]}`, `M${teamA[1]}`, `H${teamB[0]}`, `M${teamB[1]}`];
}

/**
 * Ordena los partidos en turnos por cancha equilibrando descansos y evitando
 * partidos consecutivos cuando hay jugadores disponibles.
 */
function scheduleMixedSlots(rawMatches, courts) {
  const remaining = [...rawMatches];
  const playedCount = new Map();
  const lastSlot = new Map();
  const slots = [];
  let slotIdx = 0;

  while (remaining.length > 0) {
    const busyInSlot = new Set();
    const slotMatches = [];

    for (let c = 0; c < courts && remaining.length > 0; c++) {
      let bestIdx = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const keys = getMatchPlayerKeys(remaining[i]);
        if (keys.some((k) => busyInSlot.has(k))) continue;

        let backToBackPenalty = 0;
        let fairnessWeight = 0;
        let minRest = Infinity;
        let sumRest = 0;

        for (const k of keys) {
          const prev = lastSlot.has(k) ? lastSlot.get(k) : -10;
          const rest = slotIdx - prev;
          if (rest === 1) backToBackPenalty -= 1000;
          fairnessWeight -= (playedCount.get(k) || 0) * 50;
          if (rest < minRest) minRest = rest;
          sumRest += rest;
        }

        const score = backToBackPenalty + fairnessWeight + minRest * 20 + sumRest;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) break;
      const [chosen] = remaining.splice(bestIdx, 1);
      slotMatches.push(chosen);
      for (const k of getMatchPlayerKeys(chosen)) {
        busyInSlot.add(k);
      }
    }

    if (slotMatches.length === 0) break;

    for (const match of slotMatches) {
      for (const k of getMatchPlayerKeys(match)) {
        playedCount.set(k, (playedCount.get(k) || 0) + 1);
        lastSlot.set(k, slotIdx);
      }
    }

    slots.push(slotMatches);
    slotIdx++;
  }

  return slots;
}

function countBackToBackTransitions(slots) {
  let transitions = 0;
  let prevPlayers = new Set();

  for (const slotMatches of slots) {
    const currentPlayers = new Set();
    for (const match of slotMatches) {
      for (const key of getMatchPlayerKeys(match)) {
        if (prevPlayers.has(key)) transitions++;
        currentPlayers.add(key);
      }
    }
    prevPlayers = currentPlayers;
  }

  return transitions;
}

/**
 * Genera el calendario de partidos mixtos con parejas rotativas.
 * Para 4 hombres y 4 mujeres usa la estructura exacta de 8 partidos sin repetir compañero.
 * Si se solicitan 2 rondas, repite los partidos a continuación de la primera ronda.
 *
 * @param {Array<{ id: string, name: string, gender: 'M' | 'H' }>} players
 * @param {{ courts?: number, rounds?: number }} [options]
 */
export function generateMixedRoundRobinSchedule(players, options = {}) {
  if (!Array.isArray(players)) {
    throw new Error('Se necesita una lista válida de jugadores.');
  }

  const men = players.filter((p) => p.gender === 'H');
  const women = players.filter((p) => p.gender === 'M');

  if (men.length < 2 || women.length < 2) {
    throw new Error('Se necesitan al menos 2 mujeres y 2 hombres para generar los partidos.');
  }

  const maxUsefulCourts = Math.max(
    1,
    Math.min(Math.floor(men.length / 2), Math.floor(women.length / 2))
  );
  const requestedCourts = Number.isFinite(Number(options.courts))
    ? Math.trunc(Number(options.courts))
    : 1;
  const effectiveCourts = Math.min(Math.max(1, requestedCourts), maxUsefulCourts);
  const rounds = Number(options.rounds) === 2 ? 2 : 1;

  let baseSlots;
  if (men.length === 4 && women.length === 4) {
    if (effectiveCourts >= 2) {
      baseSlots = [
        [PRESET_4X4_MATCHES[0], PRESET_4X4_MATCHES[1]],
        [PRESET_4X4_MATCHES[2], PRESET_4X4_MATCHES[3]],
        [PRESET_4X4_MATCHES[4], PRESET_4X4_MATCHES[5]],
        [PRESET_4X4_MATCHES[6], PRESET_4X4_MATCHES[7]],
      ];
    } else {
      baseSlots = PRESET_4X4_MATCHES.map((m) => [m]);
    }
  } else if (men.length === 2 && women.length === 2) {
    baseSlots = PRESET_2X2_MATCHES.map((m) => [m]);
  } else {
    const singleRoundMatches = computeMixedMatchCount(men.length, women.length, 1);
    const rawMatches = pairIntoMatches(men.length, women.length, singleRoundMatches);
    baseSlots = scheduleMixedSlots(rawMatches, effectiveCourts);
  }

  const matches = [];
  let gameCounter = 1;
  let slotCounter = 1;

  for (let r = 1; r <= rounds; r++) {
    baseSlots.forEach((slotMatches) => {
      const activeIds = new Set();
      slotMatches.forEach(([teamA, teamB]) => {
        activeIds.add(men[teamA[0]].id);
        activeIds.add(women[teamA[1]].id);
        activeIds.add(men[teamB[0]].id);
        activeIds.add(women[teamB[1]].id);
      });

      const restingIds = players.filter((p) => !activeIds.has(p.id)).map((p) => p.id);

      slotMatches.forEach(([teamA, teamB], courtIdx) => {
        matches.push({
          id: `game-${gameCounter}`,
          gameNumber: gameCounter,
          round: r,
          slot: slotCounter,
          court: courtIdx + 1,
          teamA: {
            manId: men[teamA[0]].id,
            womanId: women[teamA[1]].id,
          },
          teamB: {
            manId: men[teamB[0]].id,
            womanId: women[teamB[1]].id,
          },
          restingIds,
          scoreA: null,
          scoreB: null,
        });
        gameCounter++;
      });
      slotCounter++;
    });
  }

  return {
    matches,
    meta: {
      menCount: men.length,
      womenCount: women.length,
      rounds,
      totalMatches: matches.length,
      totalSlots: slotCounter - 1,
      courts: effectiveCourts,
      backToBackTransitions: countBackToBackTransitions(baseSlots) * rounds,
    },
  };
}
