import React from 'react';
import { isMatchCompleted, isMatchInProgress } from '../domain/stats.js';
import TeamScoreRow from './TeamScoreRow.jsx';

/**
 * Tarjeta de partido individual con parejas mixtas rotativas y lista de descanso.
 */
export default function MatchCard({
  match,
  playerMap,
  courts,
  showRoundBadge = false,
  targetPoints,
  onScoreChange,
  onClearMatch,
}) {
  const completed = isMatchCompleted(match, targetPoints);
  const inProgress = isMatchInProgress(match, targetPoints);
  const manA = playerMap.get(match.teamA.manId) || match.teamA.manId;
  const womanA = playerMap.get(match.teamA.womanId) || match.teamA.womanId;
  const manB = playerMap.get(match.teamB.manId) || match.teamB.manId;
  const womanB = playerMap.get(match.teamB.womanId) || match.teamB.womanId;

  const labelA = `${manA} + ${womanA}`;
  const labelB = `${manB} + ${womanB}`;

  const aWon = completed && match.scoreA > match.scoreB;
  const bWon = completed && match.scoreB > match.scoreA;
  const isTie = completed && match.scoreA === match.scoreB;

  return (
    <article className={`match-card ${completed ? 'completed' : inProgress ? 'in-progress' : ''}`}>
      <div className="match-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.94rem' }}>Juego #{match.gameNumber}</span>
          {showRoundBadge && match.round && (
            <span className="badge badge-primary">
              Ronda {match.round}
            </span>
          )}
          {courts > 1 && (
            <span className="badge badge-neutral">
              Turno {match.slot} · Cancha {match.court}
            </span>
          )}
        </div>
        {completed ? (
          <span className={`badge ${isTie ? 'badge-warning' : 'badge-success'}`}>
            {isTie ? 'Empate' : 'Completado'}
          </span>
        ) : inProgress ? (
          <span className="badge badge-warning">En proceso</span>
        ) : (
          <span className="badge badge-neutral">Pendiente</span>
        )}
      </div>

      <div className="match-teams">
        <TeamScoreRow
          inputId={`${match.id}-scoreA`}
          label={labelA}
          score={match.scoreA}
          isWinner={aWon}
          matchLabel={`juego ${match.gameNumber}`}
          onScoreChange={(val) => onScoreChange(match.id, 'scoreA', val)}
        />
        <TeamScoreRow
          inputId={`${match.id}-scoreB`}
          label={labelB}
          score={match.scoreB}
          isWinner={bWon}
          matchLabel={`juego ${match.gameNumber}`}
          onScoreChange={(val) => onScoreChange(match.id, 'scoreB', val)}
        />
      </div>

      {(match.scoreA !== null || match.scoreB !== null) && (
        <div className="match-footer" style={{ justifyContent: 'flex-end', paddingTop: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onClearMatch(match.id)}
          >
            Limpiar marcador
          </button>
        </div>
      )}
    </article>
  );
}
