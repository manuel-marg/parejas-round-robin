import React, { useState } from 'react';
import { formatShareableSummary } from '../domain/storage.js';

/**
 * Vista de estadísticas, promedios y tabla de posiciones adaptable a móvil y escritorio.
 */
export default function StatsView({ tournament, standings, summary, onSaveToHistory }) {
  const [copied, setCopied] = useState(false);
  const [savedHistory, setSavedHistory] = useState(false);

  const hasPlayed = summary.completedMatches > 0;
  const hasTies = standings.some((row) => row.tied > 0);

  async function handleCopySummary() {
    const text = formatShareableSummary(tournament, standings);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copia el resumen del torneo:', text);
    }
  }

  function handleSaveHistoryClick() {
    onSaveToHistory();
    setSavedHistory(true);
    setTimeout(() => setSavedHistory(false), 2200);
  }

  function handleDownloadJson() {
    const payload = JSON.stringify(tournament, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (tournament.title || 'torneo-pickleball')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `${safeName || 'torneo'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

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
            <div className="stats-actions-row">
              <button type="button" className="btn btn-soft btn-sm" onClick={handleCopySummary}>
                {copied ? '¡Resumen copiado!' : 'Copiar resumen'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleSaveHistoryClick}>
                {savedHistory ? 'Guardado en historial' : 'Guardar historial'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadJson}>
                Exportar JSON
              </button>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${summary.progressPct}%` }} />
          </div>
        </div>
      </section>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Quién ganó más</div>
          <div className="kpi-value">
            {hasPlayed ? summary.topWinners.map((r) => r.name).join(', ') : 'Sin partidos aún'}
          </div>
          <div className="kpi-detail">
            {hasPlayed
              ? `${summary.topWinners[0].won} victoria(s) · ${summary.topWinners[0].winRate.toFixed(0)}% éxito`
              : 'Registra puntajes para calcular'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Quién ganó menos</div>
          <div className="kpi-value">
            {hasPlayed ? summary.lowestWinners.map((r) => r.name).join(', ') : 'Sin partidos aún'}
          </div>
          <div className="kpi-detail">
            {hasPlayed
              ? `${summary.lowestWinners[0].won} victoria(s) · ${summary.lowestWinners[0].winRate.toFixed(0)}% éxito`
              : 'Registra puntajes para calcular'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Mejor promedio de puntos</div>
          <div className="kpi-value">
            {summary.bestAttack ? summary.bestAttack.name : 'Sin partidos aún'}
          </div>
          <div className="kpi-detail">
            {summary.bestAttack
              ? `${summary.bestAttack.avgPointsFor.toFixed(1)} pts/juego (${summary.bestAttack.pointsFor} PF)`
              : 'Promedio de puntos a favor'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Mejor diferencia de puntos</div>
          <div className="kpi-value">
            {summary.bestDiff ? summary.bestDiff.name : 'Sin partidos aún'}
          </div>
          <div className="kpi-detail">
            {summary.bestDiff
              ? `${summary.bestDiff.pointDiff > 0 ? `+${summary.bestDiff.pointDiff}` : summary.bestDiff.pointDiff} pts acumulados`
              : 'Diferencial PF - PC'}
          </div>
        </div>
      </div>

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
