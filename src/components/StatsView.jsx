import React, { useEffect, useRef } from 'react';
import { formatShareableSummary } from '../domain/storage.js';
import { startStatsTutorial } from '../domain/tutorial.js';
import { confirmNewTournament, confirmResetScores } from '../utils/confirm.js';
import FinalMatchCard from './FinalMatchCard.jsx';

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
 * Sección reutilizable de tabla/tarjetas de promedios para un género (Mujeres u Hombres).
 */
function GenderStandingsSection({ title, subtitle, playerColumnLabel, rows, isFinished }) {
  const hasTies = rows.some((row) => row.tied > 0);

  return (
    <section className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '14px' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <h3 className="card-title">{title}</h3>
        <p className="card-subtitle">{subtitle}</p>
      </div>

      <div className="standings-mobile-list">
        {rows.map((row) => {
          const diffLabel = row.pointDiff > 0 ? `+${row.pointDiff}` : `${row.pointDiff}`;
          const isFinalist = isFinished && row.rank <= 2 && row.played > 0;
          return (
            <div
              key={row.playerId}
              className={`standing-mobile-card ${isFinalist ? 'top-row' : ''}`}
            >
              <div className="standing-mobile-header">
                <div className="standing-mobile-title">
                  <span className="standing-rank-pill">{row.rank}</span>
                  <span style={{ overflowWrap: 'anywhere' }}>{row.name}</span>
                  {isFinalist && (
                    <span className="badge badge-success">
                      Finalista
                    </span>
                  )}
                </div>
                <span className={`badge ${isFinalist ? 'badge-success' : 'badge-primary'}`}>
                  {row.played > 0 ? `${row.winRate.toFixed(0)}% vic` : '0 juegos'}
                </span>
              </div>

              <div className="standing-mobile-metrics">
                <div className="metric-cell">
                  <div className="metric-cell-label">G - P</div>
                  <div className="metric-cell-value" style={{ color: 'var(--primary)' }}>
                    {row.won}-{row.lost}
                    {hasTies && row.tied > 0 ? `-${row.tied}` : ''}
                  </div>
                </div>
                <div className="metric-cell">
                  <div className="metric-cell-label">PF / PC</div>
                  <div className="metric-cell-value">
                    {row.pointsFor}/{row.pointsAgainst}
                  </div>
                </div>
                <div className="metric-cell">
                  <div className="metric-cell-label">Dif</div>
                  <div className="metric-cell-value">{diffLabel}</div>
                </div>
                <div className="metric-cell">
                  <div className="metric-cell-label">Prom</div>
                  <div className="metric-cell-value">
                    {row.played > 0 ? row.avgPointsFor.toFixed(1) : '—'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="table-wrap standings-desktop-table" style={{ border: 'none', borderRadius: 0 }}>
        <table className="stats-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{playerColumnLabel}</th>
              <th className="num-col" title="Partidos Jugados">PJ</th>
              <th className="num-col" title="Partidos Ganados">PG</th>
              <th className="num-col" title="Partidos Perdidos">PP</th>
              {hasTies && <th className="num-col" title="Empates">PE</th>}
              <th className="num-col" title="Porcentaje de Victorias">% Vic</th>
              <th className="num-col" title="Puntos a Favor">PF</th>
              <th className="num-col" title="Puntos en Contra">PC</th>
              <th className="num-col" title="Diferencia de Puntos">Dif</th>
              <th className="num-col" title="Promedio de Puntos por Juego">Prom PF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isFinalist = isFinished && row.rank <= 2 && row.played > 0;
              return (
                <tr key={row.playerId} className={isFinalist ? 'top-row' : ''}>
                  <td style={{ fontWeight: 700 }}>{row.rank}</td>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span>{row.name}</span>
                      {isFinalist && (
                        <span className="badge badge-success">
                          Finalista
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="num-col">{row.played}</td>
                  <td className="num-col" style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.won}</td>
                  <td className="num-col">{row.lost}</td>
                  {hasTies && <td className="num-col">{row.tied}</td>}
                  <td className="num-col">{row.played > 0 ? `${row.winRate.toFixed(0)}%` : '—'}</td>
                  <td className="num-col">{row.pointsFor}</td>
                  <td className="num-col">{row.pointsAgainst}</td>
                  <td className="num-col" style={{ fontWeight: 600 }}>
                    {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                  </td>
                  <td className="num-col">{row.played > 0 ? row.avgPointsFor.toFixed(1) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Vista de promedios individuales (mujeres primero y luego hombres),
 * Gran Final entre los 2 mejores de cada lista y botón para compartir por WhatsApp.
 */
export default function StatsView({
  tournament,
  standings,
  summary,
  finalMatchResolved,
  onFinalScoreChange,
  onFinalPairingChange,
  onClearFinal,
  onGoToMatches,
  onResetScores,
  onNewTournament,
  autoStartTour = false,
  manualTourTick = 0,
  onStatsTourComplete,
}) {
  const driverRef = useRef(null);
  const onTourCompleteRef = useRef(onStatsTourComplete);
  onTourCompleteRef.current = onStatsTourComplete;
  const shareText = formatShareableSummary(tournament, standings, finalMatchResolved);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const lastManualTickRef = useRef(0);

  useEffect(() => {
    if (!autoStartTour) return undefined;
    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
      driverRef.current = startStatsTutorial({
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
      driverRef.current = startStatsTutorial({
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
    <div>
      <section id="tour-stats-progress" className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <h2 className="card-title">
                {summary.isFinished ? 'Tabla de posiciones finales' : 'Tabla de posiciones en progreso'}
              </h2>
              <p className="card-subtitle">
                {summary.completedMatches} de {summary.totalMatches} partidos completados ({summary.progressPct}%) ·{' '}
                Clasifican las 2 mejores mujeres y los 2 mejores hombres a la Gran Final.
              </p>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <WhatsAppIcon size={18} />
              <span>Compartir resultados por WhatsApp</span>
            </a>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${summary.progressPct}%` }} />
          </div>

          <div className="standings-rule-note">
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px', color: 'var(--primary)', flexShrink: 0 }}>
              info
            </span>
            <span>
              <strong>Criterio de clasificación a la Gran Final:</strong> Clasifican las 2 mejores mujeres y los 2 mejores hombres. En caso de empate en partidos ganados (PG), clasifica quien tenga mejor diferencia de puntos (+Dif).
            </span>
          </div>
        </div>
      </section>

      <div id="tour-stats-women">
        <GenderStandingsSection
          title="1. Mujeres — Posiciones individuales"
          subtitle="Las 2 mejores mujeres clasifican a la Gran Final."
          playerColumnLabel="Jugadora"
          rows={standings.women}
          isFinished={summary.isFinished}
        />
      </div>

      <div id="tour-stats-men">
        <GenderStandingsSection
          title="2. Hombres — Posiciones individuales"
          subtitle="Los 2 mejores hombres clasifican a la Gran Final."
          playerColumnLabel="Jugador"
          rows={standings.men}
          isFinished={summary.isFinished}
        />
      </div>

      <div className="standings-legend-card" style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
            help
          </span>
          Guía de siglas:
        </div>
        <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong>G - P (PG / PP):</strong> Partidos Ganados y Perdidos ·{' '}
          <strong>PF / PC:</strong> Puntos a Favor y en Contra ·{' '}
          <strong>Dif:</strong> Diferencia de puntos (PF menos PC) ·{' '}
          <strong>Prom:</strong> Promedio de puntos anotados por partido.
        </div>
      </div>

      <div id="tour-stats-final">
        <FinalMatchCard
          finalMatchResolved={finalMatchResolved}
          isQualifyingFinished={summary.isFinished}
          targetPoints={tournament?.targetPoints}
          onFinalScoreChange={onFinalScoreChange}
          onFinalPairingChange={onFinalPairingChange}
          onClearFinal={onClearFinal}
          onGoToMatches={onGoToMatches}
          whatsappHref={whatsappHref}
        />
      </div>

      {finalMatchResolved?.completed && (
        <section className="card" style={{ marginTop: '16px' }}>
          <h2 className="card-title">Acciones finales del torneo</h2>
          <p className="card-subtitle">
            Comparte los resultados oficiales con el grupo o gestiona el siguiente paso para el torneo.
          </p>

          <div className="history-actions-list">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="history-action-card-btn"
            >
              <div className="history-action-icon-wrap whatsapp" aria-hidden="true">
                <WhatsAppIcon size={24} />
              </div>
              <div className="history-action-content">
                <span className="history-action-title">Compartir resultados por WhatsApp</span>
                <span className="history-action-subtitle">
                  Envía el resumen completo con posiciones, promedios individuales y campeones de la Gran Final al chat grupal.
                </span>
              </div>
              <span className="material-symbols-outlined history-action-arrow" aria-hidden="true">
                chevron_right
              </span>
            </a>

            {onResetScores && (
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
                    Borra todos los marcadores ingresados (incluyendo la Gran Final) para volver a jugarlos desde cero con el mismo grupo.
                  </span>
                </div>
                <span className="material-symbols-outlined history-action-arrow" aria-hidden="true">
                  chevron_right
                </span>
              </button>
            )}

            {onNewTournament && (
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
                    Regresa a la configuración inicial para ajustar la lista de participantes o comenzar un nuevo torneo.
                  </span>
                </div>
                <span className="material-symbols-outlined history-action-arrow" aria-hidden="true">
                  chevron_right
                </span>
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
