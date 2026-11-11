import React from 'react';
import { isMatchCompleted } from '../domain/stats.js';

/**
 * Tarjeta de partido individual con botones táctiles (-/+), entrada directa y descanso.
 */
export default function MatchCard({ match, pairMap, courts, onScoreChange, onClearMatch }) {
  const completed = isMatchCompleted(match);
  const nameA = pairMap.get(match.pairAId) || match.pairAId;
  const nameB = pairMap.get(match.pairBId) || match.pairBId;
  const restingNames = (match.restingIds || []).map((id) => pairMap.get(id) || id);

  const aWon = completed && match.scoreA > match.scoreB;
  const bWon = completed && match.scoreB > match.scoreA;
  const isTie = completed && match.scoreA === match.scoreB;

  function handleInput(side, rawValue) {
    if (rawValue === '') {
      onScoreChange(match.id, side, null);
      return;
    }
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onScoreChange(match.id, side, Math.min(99, parsed));
    }
  }

  function stepScore(side, delta) {
    const current = match[side];
    if (typeof current !== 'number') {
      onScoreChange(match.id, side, delta > 0 ? 1 : 0);
      return;
    }
    const next = Math.max(0, Math.min(99, current + delta));
    onScoreChange(match.id, side, next);
  }

  return (
    <article className={`match-card ${completed ? 'completed' : ''}`}>
      <div className="match-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.94rem' }}>Juego #{match.gameNumber}</span>
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
        ) : (
          <span className="badge badge-neutral">Pendiente</span>
        )}
      </div>

      <div className="match-teams">
        <div className={`team-score-row ${aWon ? 'winner' : ''}`}>
          <span className="team-label" title={nameA}>
            {aWon ? '✓ ' : ''}
            {nameA}
          </span>
          <div className="score-stepper">
            <button
              type="button"
              className="stepper-btn"
              aria-label={`Restar punto a ${nameA} en juego ${match.gameNumber}`}
              disabled={typeof match.scoreA !== 'number' || match.scoreA <= 0}
              onClick={() => stepScore('scoreA', -1)}
            >
              −
            </button>
            <input
              id={`${match.id}-scoreA`}
              name={`${match.id}-scoreA`}
              type="number"
              inputMode="numeric"
              min="0"
              max="99"
              className="score-input"
              aria-label={`Puntaje de ${nameA} en juego ${match.gameNumber}`}
              placeholder="0"
              value={match.scoreA ?? ''}
              onChange={(e) => handleInput('scoreA', e.target.value)}
            />
            <button
              type="button"
              className="stepper-btn"
              aria-label={`Sumar punto a ${nameA} en juego ${match.gameNumber}`}
              disabled={typeof match.scoreA === 'number' && match.scoreA >= 99}
              onClick={() => stepScore('scoreA', 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className={`team-score-row ${bWon ? 'winner' : ''}`}>
          <span className="team-label" title={nameB}>
            {bWon ? '✓ ' : ''}
            {nameB}
          </span>
          <div className="score-stepper">
            <button
              type="button"
              className="stepper-btn"
              aria-label={`Restar punto a ${nameB} en juego ${match.gameNumber}`}
              disabled={typeof match.scoreB !== 'number' || match.scoreB <= 0}
              onClick={() => stepScore('scoreB', -1)}
            >
              −
            </button>
            <input
              id={`${match.id}-scoreB`}
              name={`${match.id}-scoreB`}
              type="number"
              inputMode="numeric"
              min="0"
              max="99"
              className="score-input"
              aria-label={`Puntaje de ${nameB} en juego ${match.gameNumber}`}
              placeholder="0"
              value={match.scoreB ?? ''}
              onChange={(e) => handleInput('scoreB', e.target.value)}
            />
            <button
              type="button"
              className="stepper-btn"
              aria-label={`Sumar punto a ${nameB} en juego ${match.gameNumber}`}
              disabled={typeof match.scoreB === 'number' && match.scoreB >= 99}
              onClick={() => stepScore('scoreB', 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="match-footer">
        <span className="resting-text">
          {restingNames.length > 0 ? `Descansan: ${restingNames.join(', ')}` : 'Todas las parejas juegan'}
        </span>
        {(match.scoreA !== null || match.scoreB !== null) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onClearMatch(match.id)}
          >
            Limpiar
          </button>
        )}
      </div>
    </article>
  );
}
