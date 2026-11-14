import React from 'react';
import TeamScoreRow from './TeamScoreRow.jsx';

/**
 * Tarjeta de la Gran Final entre las 2 mejores mujeres y los 2 mejores hombres.
 */
export default function FinalMatchCard({
  finalMatchResolved,
  isQualifyingFinished,
  targetPoints,
  onFinalScoreChange,
  onFinalPairingChange,
  onClearFinal,
  onGoToMatches,
  onGoToStats,
}) {
  if (!isQualifyingFinished) {
    return (
      <section className="card final-pending-card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <span className="final-pending-icon" aria-hidden="true">
            ⏳
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span className="badge badge-warning">Gran Final · Pendiente</span>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.02rem', fontWeight: 700, color: 'var(--text)' }}>
              La Gran Final se habilitará al completar todos los partidos
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Para calcular con certeza quiénes son los 2 mejores hombres y las 2 mejores mujeres que clasificarán, primero debes registrar los resultados de todos los partidos correspondientes en la pestaña de <strong>Juegos</strong>.
            </p>
            {onGoToMatches && (
              <button
                type="button"
                className="btn btn-soft btn-sm"
                style={{ marginTop: '12px' }}
                onClick={onGoToMatches}
              >
                ← Ir a registrar partidos pendientes
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (!finalMatchResolved) return null;

  const {
    pairingMode,
    topWomen,
    topMen,
    teamA,
    teamB,
    scoreA,
    scoreB,
    completed,
    winnerSide,
  } = finalMatchResolved;

  const inProgress = !completed && (scoreA !== null || scoreB !== null);

  const labelA = `${teamA.man.name} + ${teamA.woman.name}`;
  const labelB = `${teamB.man.name} + ${teamB.woman.name}`;

  return (
    <section className="card final-card" style={{ marginBottom: '14px' }}>
      <div className="match-header" style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-success">Gran Final</span>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>
            2 mejores mujeres y 2 mejores hombres
          </span>
        </div>
        {completed ? (
          <span className={`badge ${winnerSide === 'tie' ? 'badge-warning' : 'badge-success'}`}>
            {winnerSide === 'tie' ? 'Empate' : 'Final completada'}
          </span>
        ) : inProgress ? (
          <span className="badge badge-warning">En proceso</span>
        ) : (
          <span className="badge badge-primary">Lista para jugar</span>
        )}
      </div>

      <p className="card-subtitle" style={{ marginBottom: '10px' }}>
        Clasificadas: <strong>1° {topWomen[0].name}</strong>, <strong>2° {topWomen[1].name}</strong> ·{' '}
        Clasificados: <strong>1° {topMen[0].name}</strong>, <strong>2° {topMen[1].name}</strong>
      </p>

      <div className="final-pairing-bar">
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Cruce de parejas:
        </span>
        <div className="pill-group" role="group" aria-label="Formato de parejas para la final">
          <button
            type="button"
            className={`pill-btn ${pairingMode === 'crossed' ? 'active' : ''}`}
            onClick={() => onFinalPairingChange('crossed')}
          >
            1°H + 2°M vs 2°H + 1°M
          </button>
          <button
            type="button"
            className={`pill-btn ${pairingMode === 'seeded' ? 'active' : ''}`}
            onClick={() => onFinalPairingChange('seeded')}
          >
            1°H + 1°M vs 2°H + 2°M
          </button>
        </div>
      </div>

      <div className="match-teams" style={{ marginTop: '10px' }}>
        <TeamScoreRow
          inputId="final-scoreA"
          label={labelA}
          score={scoreA}
          isWinner={completed && winnerSide === 'A'}
          matchLabel="Gran Final"
          onScoreChange={(val) => onFinalScoreChange('scoreA', val)}
        />
        <TeamScoreRow
          inputId="final-scoreB"
          label={labelB}
          score={scoreB}
          isWinner={completed && winnerSide === 'B'}
          matchLabel="Gran Final"
          onScoreChange={(val) => onFinalScoreChange('scoreB', val)}
        />
      </div>

      <div className="match-footer" style={{ marginTop: '10px' }}>
        <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1, minWidth: 0 }}>
          {completed ? (
            winnerSide === 'A' ? (
              <>Campeones de la Final: {labelA}</>
            ) : winnerSide === 'B' ? (
              <>Campeones de la Final: {labelB}</>
            ) : (
              'La final terminó empatada — ajusta el marcador si juegan desempate.'
            )
          ) : inProgress ? (
            `Partido en proceso (a ${targetPoints || 11} pts) — ingresa el resultado definitivo.`
          ) : (
            'Captura el marcador del partido final.'
          )}
        </span>
        {(scoreA !== null || scoreB !== null) && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClearFinal}>
            Limpiar
          </button>
        )}
      </div>
    </section>
  );
}
