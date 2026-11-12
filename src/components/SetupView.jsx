import React, { useEffect, useRef, useState } from 'react';
import { computeMixedMatchCount } from '../domain/scheduler.js';
import { startSetupTutorial } from '../domain/tutorial.js';

/**
 * Pantalla inicial para registrar mujeres y hombres de forma individual,
 * configurar canchas/puntaje y generar el rol de parejas rotativas.
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
  const [women, setWomen] = useState([]);
  const [men, setMen] = useState([]);
  const [newWomanName, setNewWomanName] = useState('');
  const [newManName, setNewManName] = useState('');
  const [courts, setCourts] = useState(1);
  const [targetPoints, setTargetPoints] = useState(11);
  const [error, setError] = useState('');

  const driverRef = useRef(null);
  const onTourCompleteRef = useRef(onSetupTourComplete);
  onTourCompleteRef.current = onSetupTourComplete;

  useEffect(() => {
    if (manualTourTick === 0 && !autoStartTour) {
      return undefined;
    }
    const delay = manualTourTick > 0 ? 80 : 300;
    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
      driverRef.current = startSetupTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, delay);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [autoStartTour, manualTourTick]);

  const canComputeSchedule = women.length >= 2 && men.length >= 2;
  const totalMatches = canComputeSchedule
    ? computeMixedMatchCount(men.length, women.length)
    : 0;
  const maxCourts = Math.max(
    1,
    Math.min(Math.floor(women.length / 2), Math.floor(men.length / 2))
  );
  const effectiveCourts = Math.min(courts, maxCourts);

  const gamesPerWoman = canComputeSchedule ? (totalMatches * 2) / women.length : 0;
  const gamesPerMan = canComputeSchedule ? (totalMatches * 2) / men.length : 0;

  function handleAddWoman(e) {
    e.preventDefault();
    const cleaned = newWomanName.trim();
    if (!cleaned) return;
    setWomen((prev) => [
      ...prev,
      { id: `m-${Date.now()}-${prev.length + 1}`, name: cleaned, gender: 'M' },
    ]);
    setNewWomanName('');
    setError('');
  }

  function handleAddMan(e) {
    e.preventDefault();
    const cleaned = newManName.trim();
    if (!cleaned) return;
    setMen((prev) => [
      ...prev,
      { id: `h-${Date.now()}-${prev.length + 1}`, name: cleaned, gender: 'H' },
    ]);
    setNewManName('');
    setError('');
  }

  function handleRenameWoman(id, value) {
    setWomen((prev) => prev.map((p) => (p.id === id ? { ...p, name: value } : p)));
  }

  function handleRenameMan(id, value) {
    setMen((prev) => prev.map((p) => (p.id === id ? { ...p, name: value } : p)));
  }

  function handleRemoveWoman(id) {
    setWomen((prev) => prev.filter((p) => p.id !== id));
  }

  function handleRemoveMan(id) {
    setMen((prev) => prev.filter((p) => p.id !== id));
  }

  function handleGenerate() {
    const validWomen = women
      .map((p) => ({ ...p, name: p.name.trim(), gender: 'M' }))
      .filter((p) => p.name.length > 0);
    const validMen = men
      .map((p) => ({ ...p, name: p.name.trim(), gender: 'H' }))
      .filter((p) => p.name.length > 0);

    if (validWomen.length < 2 || validMen.length < 2) {
      setError('Debes registrar al menos 2 mujeres y 2 hombres con nombre antes de generar los juegos.');
      return;
    }

    setError('');
    onStartTournament({
      title: title.trim() || 'Torneo de Pickleball',
      players: [...validWomen, ...validMen],
      courts: effectiveCourts,
      targetPoints,
    });
  }

  return (
    <div className="setup-grid">
      <section className="card">
        <div>
          <h2 className="card-title">1. Registrar jugadores</h2>
          <p className="card-subtitle">
            Agrega a cada persona por separado (mujeres y hombres). En cada juego rotarán de pareja.
          </p>
        </div>

        <div className="gender-setup-sections">
          <div id="tour-add-women" className="gender-box">
            <div className="gender-box-header">
              <span className="gender-title">
                <span className="gender-pill gender-pill-m">M</span>
                Mujeres
              </span>
              <span className="badge badge-neutral">{women.length} registradas</span>
            </div>

            <form onSubmit={handleAddWoman} className="add-pair-form">
              <input
                id="new-woman-name"
                name="newWomanName"
                type="text"
                className="input"
                aria-label="Nombre de la jugadora"
                placeholder="Ej. Ana"
                value={newWomanName}
                onChange={(e) => setNewWomanName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Agregar
              </button>
            </form>

            <div className="pair-list">
              {women.map((player, idx) => (
                <div key={player.id} className="pair-row">
                  <span className="pair-index pair-index-m">M{idx + 1}</span>
                  <input
                    id={`player-name-${player.id}`}
                    name={`womanName-${idx + 1}`}
                    type="text"
                    className="pair-name-input"
                    aria-label={`Nombre de la jugadora ${idx + 1}`}
                    value={player.name}
                    onChange={(e) => handleRenameWoman(player.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-danger-soft btn-sm"
                    aria-label={`Eliminar a ${player.name}`}
                    onClick={() => handleRemoveWoman(player.id)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {women.length === 0 && (
                <p className="card-subtitle" style={{ padding: '6px 0' }}>
                  Sin mujeres todavía (mínimo 2; ideal 4).
                </p>
              )}
            </div>
          </div>

          <div id="tour-add-men" className="gender-box">
            <div className="gender-box-header">
              <span className="gender-title">
                <span className="gender-pill gender-pill-h">H</span>
                Hombres
              </span>
              <span className="badge badge-neutral">{men.length} registrados</span>
            </div>

            <form onSubmit={handleAddMan} className="add-pair-form">
              <input
                id="new-man-name"
                name="newManName"
                type="text"
                className="input"
                aria-label="Nombre del jugador"
                placeholder="Ej. Carlos"
                value={newManName}
                onChange={(e) => setNewManName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Agregar
              </button>
            </form>

            <div className="pair-list">
              {men.map((player, idx) => (
                <div key={player.id} className="pair-row">
                  <span className="pair-index pair-index-h">H{idx + 1}</span>
                  <input
                    id={`player-name-${player.id}`}
                    name={`manName-${idx + 1}`}
                    type="text"
                    className="pair-name-input"
                    aria-label={`Nombre del jugador ${idx + 1}`}
                    value={player.name}
                    onChange={(e) => handleRenameMan(player.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-danger-soft btn-sm"
                    aria-label={`Eliminar a ${player.name}`}
                    onClick={() => handleRemoveMan(player.id)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {men.length === 0 && (
                <p className="card-subtitle" style={{ padding: '6px 0' }}>
                  Sin hombres todavía (mínimo 2; ideal 4).
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section className="card">
          <h2 className="card-title">2. Configuración del torneo</h2>
          <p className="card-subtitle">
            Se generan las parejas mixtas rotativas y al final las 2 mejores mujeres y los 2 mejores hombres juegan la final.
          </p>

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
            {canComputeSchedule ? (
              <>
                {women.length} mujeres · {men.length} hombres · {totalMatches} partidos (
                {gamesPerWoman === gamesPerMan
                  ? `${gamesPerWoman} por persona`
                  : `${gamesPerWoman} por mujer / ${gamesPerMan} por hombre`}
                ) + Gran Final
              </>
            ) : (
              'Registra al menos 2 mujeres y 2 hombres para ver el rol de partidos.'
            )}
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
            disabled={!canComputeSchedule}
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
                      {item.players.length} jugadores · {item.champion ? `Campeón/Líder: ${item.champion}` : 'En progreso'}
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
