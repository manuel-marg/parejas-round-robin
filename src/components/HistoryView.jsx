import React from 'react';
import { isMatchCompleted } from '../domain/stats.js';

/**
 * Vista de gestión del torneo e historial guardado en este navegador.
 */
export default function HistoryView({
  tournament,
  history,
  onSaveToHistory,
  onLoadHistory,
  onDeleteHistory,
  onResetScores,
  onNewTournament,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="card">
        <h2 className="card-title">Acciones del torneo actual</h2>
        <p className="card-subtitle">
          Administra los puntajes o guarda este torneo en el historial del dispositivo.
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
        </div>

        <div style={{ marginTop: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong>Resumen del calendario:</strong> {tournament.pairs.length} parejas ·{' '}
          {tournament.matches.length} partidos · {tournament.courts} cancha(s) ·{' '}
          {tournament.meta?.backToBackTransitions === 0
            ? '0 partidos seguidos (descanso ideal garantizado)'
            : `${tournament.meta?.backToBackTransitions ?? 0} cruce(s) consecutivo(s) mínimos posibles`}
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">Historial guardado ({history.length})</h3>
        <p className="card-subtitle">
          Torneos guardados en este dispositivo.
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
