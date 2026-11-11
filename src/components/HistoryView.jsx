import React from 'react';
import { isMatchCompleted } from '../domain/stats.js';

/**
 * Vista de gestión local: historial guardado en localStorage, reinicio e importación JSON.
 */
export default function HistoryView({
  tournament,
  history,
  onSaveToHistory,
  onLoadHistory,
  onDeleteHistory,
  onResetScores,
  onNewTournament,
  onImportJson,
}) {
  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImportJson(String(reader.result || ''));
      } catch (err) {
        window.alert(err.message || 'Archivo JSON inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="card">
        <h2 className="card-title">Acciones del torneo actual</h2>
        <p className="card-subtitle">
          Todos los cambios se guardan automáticamente en el navegador (localStorage).
        </p>

        <div className="history-actions-grid">
          <button type="button" className="btn btn-primary" onClick={onSaveToHistory}>
            Guardar copia en historial
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (window.confirm('¿Borrar todos los puntajes ingresados y dejar los juegos pendientes?')) {
                onResetScores();
              }
            }}
          >
            Reiniciar puntajes
          </button>
          <button
            type="button"
            className="btn btn-danger-soft"
            onClick={() => {
              if (
                window.confirm(
                  '¿Crear un nuevo torneo desde cero? Si quieres conservar este, guárdalo en el historial primero.'
                )
              ) {
                onNewTournament();
              }
            }}
          >
            Nuevo torneo / Cambiar parejas
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            Importar respaldo (.json)
            <input id="import-json-history" name="importJsonHistory" type="file" accept="application/json,.json" hidden onChange={handleFileImport} />
          </label>
        </div>

        <div style={{ marginTop: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong>Datos técnicos del calendario actual:</strong> {tournament.pairs.length} parejas ·{' '}
          {tournament.matches.length} partidos · {tournament.courts} cancha(s) ·{' '}
          {tournament.meta?.backToBackTransitions === 0
            ? '0 partidos seguidos (descanso ideal garantizado)'
            : `${tournament.meta?.backToBackTransitions ?? 0} cruce(s) consecutivo(s) mínimos posibles`}
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">Historial guardado en este navegador ({history.length})</h3>
        <p className="card-subtitle">
          Nota: los datos viven en este dispositivo/navegador. Usa "Exportar JSON" si quieres compartir o respaldar fuera.
        </p>

        {history.length === 0 ? (
          <p className="card-subtitle" style={{ marginTop: '14px' }}>
            Aún no has guardado torneos en el historial.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            {history.map((item) => {
              const done = (item.matches || []).filter(isMatchCompleted).length;
              const dateLabel = item.savedAt
                ? new Date(item.savedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {dateLabel} · {item.pairs.length} parejas · {done}/{item.matches.length} juegos
                      {item.champion ? ` · Líder: ${item.champion}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => onLoadHistory(item)}>
                      Cargar
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-soft btn-sm"
                      onClick={() => onDeleteHistory(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
