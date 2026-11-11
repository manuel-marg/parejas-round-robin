/**
 * Cálculo de tabla de posiciones, promedios y métricas resumen del torneo.
 */

/**
 * Determina si un partido ya tiene ambos marcadores válidos capturados.
 */
export function isMatchCompleted(match) {
  return (
    match != null &&
    typeof match.scoreA === 'number' &&
    typeof match.scoreB === 'number' &&
    Number.isInteger(match.scoreA) &&
    Number.isInteger(match.scoreB) &&
    match.scoreA >= 0 &&
    match.scoreB >= 0
  );
}

/**
 * Calcula las estadísticas completas y el ranking ordenado de cada pareja.
 * @param {Array<{ id: string, name: string }>} pairs
 * @param {Array<object>} matches
 */
export function computeStandings(pairs, matches) {
  const statsByPair = new Map();

  for (const pair of pairs) {
    statsByPair.set(pair.id, {
      pairId: pair.id,
      name: pair.name,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      winRate: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      avgPointsFor: 0,
      avgPointsAgainst: 0,
      avgDiff: 0,
    });
  }

  for (const match of matches) {
    if (!isMatchCompleted(match)) continue;
    const rowA = statsByPair.get(match.pairAId);
    const rowB = statsByPair.get(match.pairBId);
    if (!rowA || !rowB) continue;

    rowA.played++;
    rowB.played++;
    rowA.pointsFor += match.scoreA;
    rowA.pointsAgainst += match.scoreB;
    rowB.pointsFor += match.scoreB;
    rowB.pointsAgainst += match.scoreA;

    if (match.scoreA > match.scoreB) {
      rowA.won++;
      rowB.lost++;
    } else if (match.scoreB > match.scoreA) {
      rowB.won++;
      rowA.lost++;
    } else {
      rowA.tied++;
      rowB.tied++;
    }
  }

  const rows = Array.from(statsByPair.values()).map((row) => {
    const pointDiff = row.pointsFor - row.pointsAgainst;
    const winRate = row.played > 0 ? (row.won / row.played) * 100 : 0;
    const avgPointsFor = row.played > 0 ? row.pointsFor / row.played : 0;
    const avgPointsAgainst = row.played > 0 ? row.pointsAgainst / row.played : 0;
    const avgDiff = row.played > 0 ? pointDiff / row.played : 0;

    return {
      ...row,
      pointDiff,
      winRate,
      avgPointsFor,
      avgPointsAgainst,
      avgDiff,
    };
  });

  rows.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.name.localeCompare(b.name, 'es');
  });

  return rows.map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));
}

/**
 * Extrae indicadores clave (mayor ganador, menor ganador, mejor promedio, progreso).
 */
export function computeSummary(standings, matches) {
  const totalMatches = matches.length;
  const completedMatches = matches.filter(isMatchCompleted).length;
  const progressPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const isFinished = totalMatches > 0 && completedMatches === totalMatches;

  const activeRows = standings.filter((row) => row.played > 0);
  if (activeRows.length === 0) {
    return {
      totalMatches,
      completedMatches,
      progressPct,
      isFinished,
      topWinners: [],
      lowestWinners: [],
      bestAttack: null,
      bestDiff: null,
    };
  }

  const maxWins = Math.max(...activeRows.map((r) => r.won));
  const minWins = Math.min(...activeRows.map((r) => r.won));

  const topWinners = activeRows.filter((r) => r.won === maxWins);
  const lowestWinners = activeRows.filter((r) => r.won === minWins);

  const bestAttack = [...activeRows].sort(
    (a, b) => b.avgPointsFor - a.avgPointsFor || b.pointDiff - a.pointDiff
  )[0];

  const bestDiff = [...activeRows].sort(
    (a, b) => b.pointDiff - a.pointDiff || b.won - a.won
  )[0];

  return {
    totalMatches,
    completedMatches,
    progressPct,
    isFinished,
    topWinners,
    lowestWinners,
    bestAttack,
    bestDiff,
  };
}
