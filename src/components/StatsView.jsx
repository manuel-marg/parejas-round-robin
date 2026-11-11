import React from 'react';
import { formatShareableSummary } from '../domain/storage.js';

/**
 * Vista directa de tabla de posiciones y botón para compartir resultados por WhatsApp.
 */
export default function StatsView({ tournament, standings, summary }) {
  const hasTies = standings.some((row) => row.tied > 0);
  const shareText = formatShareableSummary(tournament, standings);
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div>
      <section className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <h2 className="card-title">
                {summary.isFinished ? 'Estadísticas finales del torneo' : 'Estadísticas en progreso'}
              </h2>
              <p className="card-subtitle">
                {summary.completedMatches} de {summary.totalMatches} partidos completados ({summary.progressPct}%)
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

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="card-title">Tabla general de posiciones</h3>
          <p className="card-subtitle">
            Ordenada por victorias (PG), % victorias, diferencial (Dif) y puntos a favor (PF).
          </p>
        </div>

        <div className="standings-mobile-list">
          {standings.map((row) => {
            const diffLabel = row.pointDiff > 0 ? `+${row.pointDiff}` : `${row.pointDiff}`;
            return (
              <div
                key={row.pairId}
                className={`standing-mobile-card ${row.rank === 1 && row.played > 0 ? 'top-row' : ''}`}
              >
                <div className="standing-mobile-header">
                  <div className="standing-mobile-title">
                    <span className="standing-rank-pill">{row.rank}</span>
                    <span style={{ overflowWrap: 'anywhere' }}>{row.name}</span>
                  </div>
                  <span className={`badge ${row.rank === 1 && row.played > 0 ? 'badge-success' : 'badge-primary'}`}>
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
                <th>Pareja</th>
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
              {standings.map((row) => (
                <tr key={row.pairId} className={row.rank === 1 && row.played > 0 ? 'top-row' : ''}>
                  <td style={{ fontWeight: 700 }}>{row.rank}</td>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
