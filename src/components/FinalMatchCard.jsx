import React from 'react';
import TeamScoreRow from './TeamScoreRow.jsx';

/**
 * Icono SVG oficial de WhatsApp integrado.
 */
function WhatsAppIcon({ size = 20, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24a7.48 7.48 0 0 1-1.39-1.73c-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45s-.56-1.35-.77-1.85c-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28" />
    </svg>
  );
}

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
  whatsappHref,
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
    <section id="final-match-card" className="card final-card" style={{ marginBottom: '14px' }}>
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

      {completed && whatsappHref && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.94rem',
              fontWeight: 700,
            }}
          >
            <WhatsAppIcon size={20} />
            <span>Compartir resultados por WhatsApp</span>
          </a>
        </div>
      )}
    </section>
  );
}
