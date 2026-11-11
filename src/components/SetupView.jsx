import React, { useState } from 'react';

const SAMPLE_PRESETS = {
  4: ['Pareja 1 (Ana / Luis)', 'Pareja 2 (Carlos / Sofía)', 'Pareja 3 (Mateo / Elena)', 'Pareja 4 (Diego / Valeria)'],
  5: ['Ana / Luis', 'Carlos / Sofía', 'Mateo / Elena', 'Diego / Valeria', 'Jorge / Paula'],
  6: ['Ana / Luis', 'Carlos / Sofía', 'Mateo / Elena', 'Diego / Valeria', 'Jorge / Paula', 'Raúl / Carmen'],
};

/**
 * Pantalla inicial para registrar parejas, elegir canchas y generar el calendario.
 */
export default function SetupView({ onStartTournament, history, onLoadHistory, onImportJson }) {
  const [title, setTitle] = useState('Jornada de Pickleball');
  const [pairs, setPairs] = useState(() =>
    SAMPLE_PRESETS[4].map((name, i) => ({ id: `p-${i + 1}`, name }))
  );
  const [newPairName, setNewPairName] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [courts, setCourts] = useState(1);
  const [targetPoints, setTargetPoints] = useState(11);
  const [error, setError] = useState('');

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

  function handleApplyBulk() {
    const lines = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setError('Escribe al menos 2 parejas (una por línea) para importar la lista.');
      return;
    }
    setPairs(lines.map((name, idx) => ({ id: `p-${Date.now()}-${idx + 1}`, name })));
    setBulkMode(false);
    setBulkText('');
    setError('');
  }

  function handleLoadPreset(count) {
    setPairs(SAMPLE_PRESETS[count].map((name, idx) => ({ id: `p-${Date.now()}-${idx + 1}`, name })));
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
      title: title.trim() || 'Torneo Round-Robin',
      pairs: validPairs,
      courts: effectiveCourts,
      targetPoints,
    });
  }

  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImportJson(String(reader.result || ''));
        setError('');
      } catch (err) {
        setError(err.message || 'No se pudo leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="setup-grid">
      <section className="card">
        <div className="setup-header-row">
          <div>
            <h2 className="card-title">1. Registrar parejas</h2>
            <p className="card-subtitle">Agrega los nombres de todas las parejas participantes.</p>
          </div>
          <div className="preset-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBulkMode((v) => !v)}>
              {bulkMode ? 'Modo individual' : 'Pegar lista rápida'}
            </button>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => handleLoadPreset(4)}>4 parejas</button>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => handleLoadPreset(5)}>5 parejas</button>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => handleLoadPreset(6)}>6 parejas</button>
          </div>
        </div>

        {bulkMode ? (
          <div style={{ marginTop: '14px' }}>
            <label className="label" htmlFor="bulk-pairs">Escribe o pega una pareja por línea</label>
            <textarea
              id="bulk-pairs"
              className="textarea"
              rows={6}
              placeholder={'Ana / Luis\nCarlos / Sofía\nMateo / Elena\nDiego / Valeria'}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyBulk}>
                Usar esta lista
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBulkMode(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleAddPair} className="add-pair-form">
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

            <div className="pair-list">
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
                  No hay parejas todavía. Agrega al menos 2 parejas para empezar.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section className="card">
          <h2 className="card-title">2. Configuración del torneo</h2>
          <p className="card-subtitle">Se genera automáticamente el rol de juegos con descansos alternados.</p>

          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="label" htmlFor="tournament-title">Nombre del torneo</label>
              <input
                id="tournament-title"
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

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
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '14px', padding: '12px 16px' }}
            disabled={pairs.length < 2}
            onClick={handleGenerate}
          >
            Generar juegos automáticamente
          </button>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              Importar respaldo (.json)
              <input id="import-json-setup" name="importJsonSetup" type="file" accept="application/json,.json" hidden onChange={handleFileImport} />
            </label>
          </div>
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
