import React, { useEffect, useRef, useState } from 'react';
import { startSetupTutorial } from '../domain/tutorial.js';

/**
 * Pantalla inicial para agregar parejas manualmente, configurar el torneo y generar juegos.
 */
export default function SetupView({
  onStartTournament,
  history,
  onLoadHistory,
  autoStartTour = false,
  manualTourTick = 0,
  onSetupTourComplete,
}) {
  const [title, setTitle] = useState('Jornada de Pickleball');
  const [pairs, setPairs] = useState([]);
  const [newPairName, setNewPairName] = useState('');
  const [courts, setCourts] = useState(1);
  const [targetPoints, setTargetPoints] = useState(11);
  const [error, setError] = useState('');

  const driverRef = useRef(null);
  const onTourCompleteRef = useRef(onSetupTourComplete);
  onTourCompleteRef.current = onSetupTourComplete;

  useEffect(() => {
    if (!autoStartTour) return undefined;
    const timer = window.setTimeout(() => {
      driverRef.current = startSetupTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [autoStartTour]);

  useEffect(() => {
    if (manualTourTick === 0) return undefined;
    const timer = window.setTimeout(() => {
      driverRef.current = startSetupTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, 80);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [manualTourTick]);

  const totalMatches = pairs.length >= 2 ? (pairs.length * (pairs.length - 1)) / 2 : 0;
  const maxCourts = Math.max(1, Math.floor(pairs.length / 2));
  const effectiveCourts = Math.min(courts, maxCourts);

  function handleAddPair(e) {
    e.preventDefault();
    const cleaned = newPairName.trim();
    if (!cleaned) return;
    setPairs((prev) => [...prev, { id: `p-${Date.now()}-${prev.length + 1}`, name: cleaned }]);
    setNewPairName('');
    setError('');
  }

  function handleRenamePair(id, value) {
    setPairs((prev) => prev.map((p) => (p.id === id ? { ...p, name: value } : p)));
  }

  function handleRemovePair(id) {
    setPairs((prev) => prev.filter((p) => p.id !== id));
  }

  function handleGenerate() {
    const validPairs = pairs
      .map((p) => ({ ...p, name: p.name.trim() }))
      .filter((p) => p.name.length > 0);

    if (validPairs.length < 2) {
      setError('Debes registrar al menos 2 parejas con nombre antes de generar los juegos.');
      return;
    }

    setError('');
    onStartTournament({
      title: title.trim() || 'Torneo de Pickleball',
      pairs: validPairs,
      courts: effectiveCourts,
      targetPoints,
    });
  }

  return (
    <div className="setup-grid">
      <section className="card">
        <div>
          <h2 className="card-title">1. Registrar parejas</h2>
          <p className="card-subtitle">Agrega manualmente los nombres de cada pareja.</p>
        </div>

        <form id="tour-add-pair" onSubmit={handleAddPair} className="add-pair-form">
          <input
            id="new-pair-name"
            name="newPairName"
            type="text"
            className="input"
            aria-label="Nombre de la nueva pareja"
            placeholder="Ej. Laura / Andrés"
            value={newPairName}
            onChange={(e) => setNewPairName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Agregar
          </button>
        </form>

        <div id="tour-pair-list" className="pair-list">
          {pairs.map((pair, idx) => (
            <div key={pair.id} className="pair-row">
              <span className="pair-index">{idx + 1}</span>
              <input
                id={`pair-name-${pair.id}`}
                name={`pairName-${idx + 1}`}
                type="text"
                className="pair-name-input"
                aria-label={`Nombre de la pareja ${idx + 1}`}
                value={pair.name}
                onChange={(e) => handleRenamePair(pair.id, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-danger-soft btn-sm"
                aria-label={`Eliminar ${pair.name}`}
                onClick={() => handleRemovePair(pair.id)}
              >
                Quitar
              </button>
            </div>
          ))}
          {pairs.length === 0 && (
            <p className="card-subtitle" style={{ padding: '12px 0' }}>
              No hay parejas todavía. Escribe una arriba y pulsa Agregar (mínimo 2 parejas).
            </p>
          )}
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section className="card">
          <h2 className="card-title">2. Configuración del torneo</h2>
          <p className="card-subtitle">Se genera automáticamente el rol de juegos con descansos alternados.</p>

          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div id="tour-title-field">
              <label className="label" htmlFor="tournament-title">Nombre del torneo</label>
              <input
                id="tournament-title"
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div id="tour-match-rules" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label" htmlFor="courts-select">Canchas disponibles al mismo tiempo</label>
                <select
                  id="courts-select"
                  className="select"
                  value={effectiveCourts}
                  onChange={(e) => setCourts(Number(e.target.value))}
                >
                  <option value={1}>1 cancha (turnos secuenciales con descanso)</option>
                  {maxCourts >= 2 && <option value={2}>2 canchas simultáneas</option>}
                  {maxCourts >= 3 && <option value={3}>3 canchas simultáneas</option>}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="points-select">Puntaje de referencia por juego</label>
                <select
                  id="points-select"
                  className="select"
                  value={targetPoints}
                  onChange={(e) => setTargetPoints(Number(e.target.value))}
                >
                  <option value={11}>A 11 puntos (estándar pickleball)</option>
                  <option value={15}>A 15 puntos</option>
                  <option value={21}>A 21 puntos</option>
                </select>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            {pairs.length} parejas · {totalMatches} partidos todos contra todos ·{' '}
            {effectiveCourts === 1 ? '1 juego por turno' : `${effectiveCourts} canchas por turno`}
          </div>

          {error && (
            <p
              role="alert"
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          )}

          <button
            id="tour-generate-btn"
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '14px', padding: '12px 16px' }}
            disabled={pairs.length < 2}
            onClick={handleGenerate}
          >
            Generar juegos automáticamente
          </button>
        </section>

        {history.length > 0 && (
          <section className="card">
            <h3 className="card-title">Torneos guardados ({history.length})</h3>
            <p className="card-subtitle">Recupera un torneo guardado en este navegador.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.pairs.length} parejas · {item.champion ? `Líder: ${item.champion}` : 'En progreso'}
                    </div>
                  </div>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => onLoadHistory(item)}>
                    Abrir
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
