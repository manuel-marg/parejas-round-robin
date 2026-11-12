import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isMatchCompleted } from '../domain/stats.js';
import { startMatchesTutorial } from '../domain/tutorial.js';
import MatchCard from './MatchCard.jsx';

/**
 * Vista principal de juegos: resalta el próximo turno/descanso, permite llenar puntajes
 * y habilita acceso directo a estadísticas finales al completar todos los partidos.
 */
export default function MatchesView({
  tournament,
  onScoreChange,
  onClearMatch,
  onGoToStats,
  autoStartTour = false,
  manualTourTick = 0,
  onMatchesTourComplete,
}) {
  const [filter, setFilter] = useState('all');
  const [pairFilter, setPairFilter] = useState('all');

  const driverRef = useRef(null);
  const onTourCompleteRef = useRef(onMatchesTourComplete);
  onTourCompleteRef.current = onMatchesTourComplete;

  const pairMap = useMemo(
    () => new Map(tournament.pairs.map((p) => [p.id, p.name])),
    [tournament.pairs]
  );

  const pendingMatches = useMemo(
    () => tournament.matches.filter((m) => !isMatchCompleted(m)),
    [tournament.matches]
  );
  const completedCount = tournament.matches.length - pendingMatches.length;
  const allCompleted = tournament.matches.length > 0 && pendingMatches.length === 0;

  useEffect(() => {
    if (!autoStartTour || allCompleted) return undefined;
    const timer = window.setTimeout(() => {
      driverRef.current = startMatchesTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [autoStartTour, allCompleted]);

  useEffect(() => {
    if (manualTourTick === 0) return undefined;
    setFilter('all');
    setPairFilter('all');
    const timer = window.setTimeout(() => {
      driverRef.current = startMatchesTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, 80);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [manualTourTick]);

  const nextSlotMatches = useMemo(() => {
    if (pendingMatches.length === 0) return [];
    const nextSlot = pendingMatches[0].slot;
    return pendingMatches.filter((m) => m.slot === nextSlot);
  }, [pendingMatches]);

  const filteredMatches = useMemo(() => {
    return tournament.matches.filter((m) => {
      const done = isMatchCompleted(m);
      if (filter === 'pending' && done) return false;
      if (filter === 'completed' && !done) return false;
      if (pairFilter !== 'all' && m.pairAId !== pairFilter && m.pairBId !== pairFilter) {
        return false;
      }
      return true;
    });
  }, [tournament.matches, filter, pairFilter]);

  return (
    <div>
      {nextSlotMatches.length > 0 ? (
        <section id="tour-current-court" className="highlight-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                En cancha ahora · {tournament.courts > 1 ? `Turno ${nextSlotMatches[0].slot}` : `Juego #${nextSlotMatches[0].gameNumber}`}
              </span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
                {nextSlotMatches
                  .map(
                    (m) =>
                      `${tournament.courts > 1 ? `Cancha ${m.court}: ` : ''}${pairMap.get(m.pairAId)} vs ${pairMap.get(m.pairBId)}`
                  )
                  .join('  |  ')}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {(nextSlotMatches[0].restingIds || []).length > 0
                  ? `Descansan en este turno: ${nextSlotMatches[0].restingIds
                      .map((id) => pairMap.get(id))
                      .join(', ')}`
                  : 'Todas las parejas están jugando en este turno.'}
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
              {completedCount} / {tournament.matches.length} juegos listos
            </div>
          </div>
        </section>
      ) : (
        <section id="tour-current-court" className="highlight-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '4px' }}>
                Torneo completado
              </span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                Todos los {tournament.matches.length} juegos tienen marcador registrado.
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={onGoToStats}>
              Ver estadísticas finales
            </button>
          </div>
        </section>
      )}

      <div className="filter-toolbar">
        <div className="pill-group" role="group" aria-label="Filtrar juegos por estado">
          <button
            type="button"
            className={`pill-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({tournament.matches.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pendientes ({pendingMatches.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Jugados ({completedCount})
          </button>
        </div>

        <select
          id="pair-filter"
          name="pairFilter"
          className="select pair-filter-select"
          aria-label="Filtrar por pareja"
          value={pairFilter}
          onChange={(e) => setPairFilter(e.target.value)}
        >
          <option value="all">Todas las parejas</option>
          {tournament.pairs.map((pair) => (
            <option key={pair.id} value={pair.id}>
              {pair.name}
            </option>
          ))}
        </select>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p className="card-subtitle">No hay juegos que coincidan con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              pairMap={pairMap}
              courts={tournament.courts}
              onScoreChange={onScoreChange}
              onClearMatch={onClearMatch}
            />
          ))}
        </div>
      )}

      {allCompleted && (
        <section className="bottom-stats-cta">
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
              ¡Listo! Ya llenaste todos los juegos
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Consulta la tabla final de posiciones y compártela por WhatsApp.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: '300px' }}
            onClick={onGoToStats}
          >
            Ver estadísticas finales
          </button>
        </section>
      )}
    </div>
  );
}
