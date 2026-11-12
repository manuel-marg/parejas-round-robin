import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isMatchCompleted } from '../domain/stats.js';
import { startMatchesTutorial } from '../domain/tutorial.js';
import MatchCard from './MatchCard.jsx';
import FinalMatchCard from './FinalMatchCard.jsx';

/**
 * Vista principal de juegos: resalta el próximo turno/descanso, permite filtrar por jugador,
 * llenar puntajes y disputar la Gran Final al concluir la fase clasificatoria.
 */
export default function MatchesView({
  tournament,
  finalMatchResolved,
  onScoreChange,
  onClearMatch,
  onFinalScoreChange,
  onFinalPairingChange,
  onClearFinal,
  onGoToStats,
  autoStartTour = false,
  manualTourTick = 0,
  onMatchesTourComplete,
}) {
  const [filter, setFilter] = useState('all');
  const [playerFilter, setPlayerFilter] = useState('all');

  const driverRef = useRef(null);
  const onTourCompleteRef = useRef(onMatchesTourComplete);
  onTourCompleteRef.current = onMatchesTourComplete;

  const playerMap = useMemo(
    () => new Map(tournament.players.map((p) => [p.id, p.name])),
    [tournament.players]
  );

  const womenPlayers = useMemo(
    () => tournament.players.filter((p) => p.gender === 'M'),
    [tournament.players]
  );
  const menPlayers = useMemo(
    () => tournament.players.filter((p) => p.gender === 'H'),
    [tournament.players]
  );

  const pendingMatches = useMemo(
    () => tournament.matches.filter((m) => !isMatchCompleted(m)),
    [tournament.matches]
  );
  const totalMatches = tournament.matches.length;
  const completedCount = totalMatches - pendingMatches.length;
  const progressPct = totalMatches > 0 ? Math.round((completedCount / totalMatches) * 100) : 0;
  const allCompleted = totalMatches > 0 && pendingMatches.length === 0;

  useEffect(() => {
    if (manualTourTick === 0 && (!autoStartTour || allCompleted)) {
      return undefined;
    }
    if (manualTourTick > 0) {
      setFilter('all');
      setPlayerFilter('all');
    }
    const delay = manualTourTick > 0 ? 80 : 300;
    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
      driverRef.current = startMatchesTutorial({
        onComplete: () => onTourCompleteRef.current?.(),
      });
    }, delay);

    return () => {
      window.clearTimeout(timer);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [autoStartTour, manualTourTick, allCompleted]);

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
      if (playerFilter !== 'all') {
        const inMatch =
          m.teamA.manId === playerFilter ||
          m.teamA.womanId === playerFilter ||
          m.teamB.manId === playerFilter ||
          m.teamB.womanId === playerFilter;
        if (!inMatch) return false;
      }
      return true;
    });
  }, [tournament.matches, filter, playerFilter]);

  function formatMatchLabel(m) {
    const labelA = `${playerMap.get(m.teamA.manId)} + ${playerMap.get(m.teamA.womanId)}`;
    const labelB = `${playerMap.get(m.teamB.manId)} + ${playerMap.get(m.teamB.womanId)}`;
    return `${tournament.courts > 1 ? `Cancha ${m.court}: ` : ''}${labelA} vs ${labelB}`;
  }

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
                {nextSlotMatches.map(formatMatchLabel).join('  |  ')}
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
              {completedCount} / {totalMatches} juegos listos
            </div>
          </div>
        </section>
      ) : (
        <section id="tour-current-court" className="highlight-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '4px' }}>
                Fase clasificatoria completada
              </span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                Todos los {totalMatches} juegos tienen marcador. ¡Hora de la Gran Final!
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={onGoToStats}>
              Ver promedios y tabla
            </button>
          </div>
        </section>
      )}

      {/* Barra de progreso hacia la Gran Final */}
      <section className="card matches-progress-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="progress-trophy" aria-hidden="true">🏆</span>
              <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)' }}>
                {allCompleted ? '¡Fase clasificatoria completada!' : 'Progreso hacia la Gran Final'}
              </span>
            </div>
            <span
              className={`badge ${allCompleted ? 'badge-success' : 'badge-primary'}`}
              style={{ fontSize: '0.82rem', fontWeight: 700 }}
            >
              {completedCount} de {totalMatches} juegos ({progressPct}%)
            </span>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Progreso del torneo: ${progressPct}%`}
            style={{ height: '10px' }}
          >
            <div
              className="progress-fill"
              style={{
                width: `${progressPct}%`,
                background: allCompleted
                  ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                  : 'linear-gradient(90deg, #0f766e, #84cc16)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            <span>
              {allCompleted
                ? '¡100% alcanzado! La Gran Final está lista abajo con las 2 mejores mujeres y 2 mejores hombres.'
                : pendingMatches.length === 1
                ? 'Falta solo 1 juego para alcanzar el 100% y habilitar la Gran Final.'
                : `Faltan ${pendingMatches.length} juegos para completar el 100% y desbloquear la Gran Final.`}
            </span>
            {allCompleted && (
              <span style={{ fontWeight: 700, color: '#16a34a' }}>
                ✓ 100% completado
              </span>
            )}
          </div>
        </div>
      </section>

      {allCompleted && (
        <FinalMatchCard
          finalMatchResolved={finalMatchResolved}
          isQualifyingFinished={allCompleted}
          onFinalScoreChange={onFinalScoreChange}
          onFinalPairingChange={onFinalPairingChange}
          onClearFinal={onClearFinal}
        />
      )}

      {/* Filtros: visibles en escritorio para control avanzado, ocultos en móviles para una vista limpia */}
      <div className="filter-toolbar desktop-filter-toolbar">
        <div className="pill-group" role="group" aria-label="Filtrar juegos por estado">
          <button
            type="button"
            className={`pill-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos ({totalMatches})
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
          id="player-filter"
          name="playerFilter"
          className="select pair-filter-select"
          aria-label="Filtrar por jugador"
          value={playerFilter}
          onChange={(e) => setPlayerFilter(e.target.value)}
        >
          <option value="all">Todos los jugadores</option>
          <optgroup label="Mujeres">
            {womenPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Hombres">
            {menPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
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
              playerMap={playerMap}
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
              {finalMatchResolved?.completed
                ? '¡Torneo y Gran Final completados!'
                : '¡Listo! Ya llenaste todos los juegos clasificatorios'}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Consulta los promedios individuales (mujeres y hombres) y compártelos por WhatsApp.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: '300px' }}
            onClick={onGoToStats}
          >
            Ver promedios finales
          </button>
        </section>
      )}
    </div>
  );
}
