import React from 'react';

/**
 * Fila reutilizable con etiqueta de pareja y selector táctil de puntaje (− / input / +).
 */
export default function TeamScoreRow({
  inputId,
  label,
  score,
  isWinner,
  matchLabel,
  onScoreChange,
}) {
  function handleInput(rawValue) {
    if (rawValue === '') {
      onScoreChange(null);
      return;
    }
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onScoreChange(Math.min(99, parsed));
    }
  }

  function stepScore(delta) {
    if (typeof score !== 'number') {
      onScoreChange(delta > 0 ? 1 : 0);
      return;
    }
    const next = Math.max(0, Math.min(99, score + delta));
    onScoreChange(next);
  }

  return (
    <div className={`team-score-row ${isWinner ? 'winner' : ''}`}>
      <span className="team-label" title={label}>
        {isWinner ? '✓ ' : ''}
        {label}
      </span>
      <div className="score-stepper">
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Restar punto a ${label} en ${matchLabel}`}
          disabled={typeof score !== 'number' || score <= 0}
          onClick={() => stepScore(-1)}
        >
          −
        </button>
        <input
          id={inputId}
          name={inputId}
          type="number"
          inputMode="numeric"
          min="0"
          max="99"
          className="score-input"
          aria-label={`Puntaje de ${label} en ${matchLabel}`}
          placeholder="0"
          value={score ?? ''}
          onChange={(e) => handleInput(e.target.value)}
        />
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Sumar punto a ${label} en ${matchLabel}`}
          disabled={typeof score === 'number' && score >= 99}
          onClick={() => stepScore(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
