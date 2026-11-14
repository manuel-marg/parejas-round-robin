import React, { useEffect, useRef } from 'react';
import { isMatchCompleted } from '../domain/stats.js';
import { startHistoryTutorial } from '../domain/tutorial.js';
import {
  confirmDeleteHistory,
  confirmNewTournament,
  confirmResetScores,
} from '../utils/confirm.js';

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
  autoStartTour = false,
  manualTourTick = 0,
  onHistoryTourComplete,
}) {
  const driverRef = useRef(null);
  const onTourCompleteRef = useRef(onHistoryTourComplete);
  onTourCompleteRef.current = onHistoryTourComplete;

  const lastManualTickRef = useRef(0);

  useEffect(() => {
    if (!autoStartTour) return undefined;
    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
      driverRef.current = startHistoryTutorial({
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
    if (manualTourTick === 0 || manualTourTick === lastManualTickRef.current) {
      return undefined;
    }
    lastManualTickRef.current = manualTourTick;

    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
      driverRef.current = startHistoryTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, 80);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [manualTourTick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section id="tour-history-actions" className="card">
        <h2 className="card-title">Acciones del torneo actual</h2>
        <p className="card-subtitle">
          Administra los puntajes o guarda este torneo en el historial del dispositivo.
        </p>

        <div className="history-actions-list">
          <button
            type="button"
            className="history-action-card-btn"
            onClick={onSaveToHistory}
          >
            <div className="history-action-icon-wrap primary" aria-hidden="true">
              <span className="material-symbols-outlined">save</span>
            </div>
            <div className="history-action-content">
              <span className="history-action-title">Guardar copia en historial</span>
              <span className="history-action-subtitle">
                Guarda un respaldo de este torneo con todos sus marcadores y estadísticas en este dispositivo.
              </span>
            </div>
            <span className="material-symbols-outlined history-action-arrow" aria-hidden="true">
              chevron_right
            </span>
          </button>

          <button
            type="button"
            className="history-action-card-btn"
            onClick={async () => {
              const confirmed = await confirmResetScores();
              if (confirmed) {
                onResetScores();
              }
            }}
          >
            <div className="history-action-icon-wrap warning" aria-hidden="true">
              <span className="material-symbols-outlined">restart_alt</span>
            </div>
            <div className="history-action-content">
              <span className="history-action-title">Reiniciar puntajes</span>
              <span className="history-action-subtitle">
                Borra todos los marcadores ingresados (incluyendo la Gran Final) para volver a jugarlos desde cero.
              </span>
            </div>
            <span className="material-symbols-outlined history-action-arrow" aria-hidden="true">
              chevron_right
            </span>
          </button>

          <button
            type="button"
            className="history-action-card-btn"
            onClick={async () => {
              const confirmed = await confirmNewTournament();
              if (confirmed) {
                onNewTournament();
              }
            }}
          >
            <div className="history-action-icon-wrap danger" aria-hidden="true">
              <span className="material-symbols-outlined">group_add</span>
            </div>
            <div className="history-action-content">
              <span className="history-action-title">Nuevo torneo / Cambiar jugadores</span>
              <span className="history-action-subtitle">
                Regresa a la configuración inicial para ajustar los participantes o crear un nuevo torneo.
              </span>
            </div>
            <span className="material-symbols-outlined history-action-arrow" aria-hidden="true">
              chevron_right
            </span>
          </button>
        </div>
      </section>

      <section id="tour-history-list" className="card">
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
              const done = (item.matches || []).filter((m) =>
                isMatchCompleted(m, item.targetPoints)
              ).length;
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
                      {dateLabel} · {item.players.length} jugadores · {done}/{item.matches.length} juegos
                      {item.champion ? ` · Líder/Campeones: ${item.champion}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => onLoadHistory(item)}>
                      Cargar
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-soft btn-sm"
                      onClick={async () => {
                        const confirmed = await confirmDeleteHistory(item.title);
                        if (confirmed) {
                          onDeleteHistory(item.id);
                        }
                      }}
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
