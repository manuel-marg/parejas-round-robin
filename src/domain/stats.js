/**
 * Cálculo de tabla de posiciones individuales (mujeres y hombres), promedios
 * y clasificación de los 2 mejores hombres y las 2 mejores mujeres a la Gran Final.
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

function sortPlayerRows(rows) {
  return [...rows]
    .sort((a, b) => {
      if (b.won !== a.won) return b.won - a.won;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      if (b.avgPointsFor !== a.avgPointsFor) return b.avgPointsFor - a.avgPointsFor;
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      return a.name.localeCompare(b.name, 'es');
    })
    .map((row, idx) => ({
      ...row,
      rank: idx + 1,
    }));
}

/**
 * Calcula las estadísticas individuales y rankings separados para mujeres y hombres.
 * @param {Array<{ id: string, name: string, gender: 'M' | 'H' }>} players
 * @param {Array<object>} matches
 */
export function computeIndividualStandings(players, matches) {
  const statsByPlayer = new Map();

  for (const player of players) {
    statsByPlayer.set(player.id, {
      playerId: player.id,
      name: player.name,
      gender: player.gender,
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

  function applyTeamMatch(playerIds, scored, allowed) {
    for (const pid of playerIds) {
      const row = statsByPlayer.get(pid);
      if (!row) continue;
      row.played++;
      row.pointsFor += scored;
      row.pointsAgainst += allowed;
      if (scored > allowed) {
        row.won++;
      } else if (scored < allowed) {
        row.lost++;
      } else {
        row.tied++;
      }
    }
  }

  for (const match of matches) {
    if (!isMatchCompleted(match)) continue;
    if (!match.teamA || !match.teamB) continue;

    applyTeamMatch(
      [match.teamA.manId, match.teamA.womanId],
      match.scoreA,
      match.scoreB
    );
    applyTeamMatch(
      [match.teamB.manId, match.teamB.womanId],
      match.scoreB,
      match.scoreA
    );
  }

  const finalized = Array.from(statsByPlayer.values()).map((row) => {
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

  const women = sortPlayerRows(finalized.filter((r) => r.gender === 'M'));
  const men = sortPlayerRows(finalized.filter((r) => r.gender === 'H'));

  return {
    women,
    men,
    all: [...women, ...men],
  };
}

/**
 * Construye los equipos de la Gran Final con las 2 mejores mujeres y los 2 mejores hombres.
 * Por defecto usa cruce balanceado (1° H + 2° M vs 2° H + 1° M).
 */
export function resolveFinalMatch(standings, finalMatch) {
  const women = standings?.women || [];
  const men = standings?.men || [];
  const canFormFinal = women.length >= 2 && men.length >= 2;

  if (!canFormFinal) {
    return null;
  }

  const pairingMode = finalMatch?.pairingMode === 'seeded' ? 'seeded' : 'crossed';
  const topWomen = [women[0], women[1]];
  const topMen = [men[0], men[1]];

  const teamA =
    pairingMode === 'seeded'
      ? { man: topMen[0], woman: topWomen[0] }
      : { man: topMen[0], woman: topWomen[1] };

  const teamB =
    pairingMode === 'seeded'
      ? { man: topMen[1], woman: topWomen[1] }
      : { man: topMen[1], woman: topWomen[0] };

  const scoreA = finalMatch?.scoreA ?? null;
  const scoreB = finalMatch?.scoreB ?? null;
  const completed = isMatchCompleted({ scoreA, scoreB });

  let winnerSide = null;
  if (completed) {
    if (scoreA > scoreB) winnerSide = 'A';
    else if (scoreB > scoreA) winnerSide = 'B';
    else winnerSide = 'tie';
  }

  return {
    pairingMode,
    topWomen,
    topMen,
    teamA,
    teamB,
    scoreA,
    scoreB,
    completed,
    winnerSide,
  };
}

/**
 * Extrae indicadores de progreso de la fase clasificatoria y estado de la final.
 */
export function computeSummary(standings, matches, finalMatch) {
  const totalMatches = matches.length;
  const completedMatches = matches.filter(isMatchCompleted).length;
  const progressPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  const isFinished = totalMatches > 0 && completedMatches === totalMatches;
  const isFinalCompleted = isFinished && isMatchCompleted(finalMatch);

  return {
    totalMatches,
    completedMatches,
    progressPct,
    isFinished,
    isFinalCompleted,
    topWomen: (standings?.women || []).slice(0, 2),
    topMen: (standings?.men || []).slice(0, 2),
  };
}
