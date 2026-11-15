import React from 'react';
import { isMatchCompleted } from '../domain/stats.js';
import { confirmDeleteHistory } from '../utils/confirm.js';

/**
 * Pantalla dedicada para visualizar y gestionar los torneos guardados en este dispositivo.
 */
export default function SavedTournamentsView({
  history = [],
  onBackToWelcome,
  onCreateTournament,
  onLoadHistory,
  onDeleteHistory,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        onClick={onBackToWelcome}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>
          arrow_back
        </span>
        <span>Volver al menú principal</span>
      </button>

      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <div>
            <h2 className="card-title">Torneos guardados ({history.length})</h2>
            <p className="card-subtitle">
              Historial de torneos almacenados localmente en este dispositivo.
            </p>
          </div>
          {onCreateTournament && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onCreateTournament}
            >
              + Crear nuevo torneo
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', background: 'var(--surface-alt)', borderRadius: '12px', marginTop: '12px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}
              aria-hidden="true"
            >
              history
            </span>
            <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text)', marginBottom: '4px' }}>
              Aún no tienes torneos guardados
            </div>
            <p style={{ margin: '0 auto 16px', maxWidth: '380px', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Cuando generes y juegues un torneo, podrás guardar un respaldo con sus posiciones y marcadores para consultarlo o reanudarlo aquí.
            </p>
            {onCreateTournament && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCreateTournament}
              >
                Crear tu primer torneo
              </button>
            )}
          </div>
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
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)', marginBottom: '2px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {dateLabel && `${dateLabel} · `}
                      {item.players.length} jugadores · {done}/{item.matches.length} juegos
                      {item.champion ? ` · Campeón/Líder: ${item.champion}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-soft btn-sm"
                      onClick={() => onLoadHistory(item)}
                    >
                      Cargar torneo
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
