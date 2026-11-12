import React, { useEffect, useRef } from 'react';
import { formatShareableSummary } from '../domain/storage.js';
import { startStatsTutorial } from '../domain/tutorial.js';
import FinalMatchCard from './FinalMatchCard.jsx';

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
  autoStartTour = false,
  manualTourTick = 0,
  onStatsTourComplete,
}) {
  const driverRef = useRef(null);
  const onTourCompleteRef = useRef(onStatsTourComplete);
  onTourCompleteRef.current = onStatsTourComplete;
  const shareText = formatShareableSummary(tournament, standings, finalMatchResolved);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    if (manualTourTick === 0 && !autoStartTour) {
      return undefined;
    }
    const delay = manualTourTick > 0 ? 80 : 300;
    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
      driverRef.current = startStatsTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, delay);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [autoStartTour, manualTourTick]);

  return (
    <div>
      <section id="tour-stats-progress" className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <h2 className="card-title">
                {summary.isFinished ? 'Promedios finales del torneo' : 'Promedios en progreso'}
              </h2>
              <p className="card-subtitle">
                {summary.completedMatches} de {summary.totalMatches} partidos completados ({summary.progressPct}%) ·{' '}
                Ordenado por victorias (PG), % victorias, diferencial (Dif) y promedio de puntos (Prom PF).
              </p>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-sm"
            >
              Compartir resultados por WhatsApp
            </a>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${summary.progressPct}%` }} />
          </div>
        </div>
      </section>

      <div id="tour-stats-women">
        <GenderStandingsSection
          title="1. Mujeres — Promedios individuales"
          subtitle="Las 2 mejores mujeres clasifican a la Gran Final."
          playerColumnLabel="Jugadora"
          rows={standings.women}
          isFinished={summary.isFinished}
        />
      </div>

      <div id="tour-stats-men">
        <GenderStandingsSection
          title="2. Hombres — Promedios individuales"
          subtitle="Los 2 mejores hombres clasifican a la Gran Final."
          playerColumnLabel="Jugador"
          rows={standings.men}
          isFinished={summary.isFinished}
        />
      </div>

      <div id="tour-stats-final">
        <FinalMatchCard
          finalMatchResolved={finalMatchResolved}
          isQualifyingFinished={summary.isFinished}
          onFinalScoreChange={onFinalScoreChange}
          onFinalPairingChange={onFinalPairingChange}
          onClearFinal={onClearFinal}
          onGoToMatches={onGoToMatches}
        />
      </div>
    </div>
  );
}
