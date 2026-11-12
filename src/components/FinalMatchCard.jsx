import React from 'react';
import TeamScoreRow from './TeamScoreRow.jsx';

/**
 * Tarjeta de la Gran Final entre las 2 mejores mujeres y los 2 mejores hombres.
 */
export default function FinalMatchCard({
  finalMatchResolved,
  isQualifyingFinished,
  onFinalScoreChange,
  onFinalPairingChange,
  onClearFinal,
}) {
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
        {isQualifyingFinished ? (
          completed ? (
            <span className={`badge ${winnerSide === 'tie' ? 'badge-warning' : 'badge-success'}`}>
              {winnerSide === 'tie' ? 'Empate' : 'Final completada'}
            </span>
          ) : (
            <span className="badge badge-primary">Lista para jugar</span>
          )
        ) : (
          <span className="badge badge-neutral">Se habilita al completar los juegos</span>
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

      {isQualifyingFinished ? (
        <>
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
            <span className="resting-text" style={{ fontWeight: 600, color: 'var(--text)' }}>
              {completed ? (
                winnerSide === 'A' ? (
                  <>Campeones de la Final: {labelA}</>
                ) : winnerSide === 'B' ? (
                  <>Campeones de la Final: {labelB}</>
                ) : (
                  'La final terminó empatada — ajusta el marcador si juegan desempate.'
                )
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
        </>
      ) : (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
          }}
        >
          Proyección actual: <strong>{labelA}</strong> vs <strong>{labelB}</strong>
        </div>
      )}
    </section>
  );
}
