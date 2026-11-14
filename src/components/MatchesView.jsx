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
  const [roundFilter, setRoundFilter] = useState('all');

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
    () => tournament.matches.filter((m) => !isMatchCompleted(m, tournament.targetPoints)),
    [tournament.matches, tournament.targetPoints]
  );
  const totalMatches = tournament.matches.length;
  const completedCount = totalMatches - pendingMatches.length;
  const progressPct = totalMatches > 0 ? Math.round((completedCount / totalMatches) * 100) : 0;
  const allCompleted = totalMatches > 0 && pendingMatches.length === 0;

  const lastManualTickRef = useRef(0);

  useEffect(() => {
    if (!autoStartTour || allCompleted) return undefined;
    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
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
    if (manualTourTick === 0 || manualTourTick === lastManualTickRef.current) {
      return undefined;
    }
    lastManualTickRef.current = manualTourTick;

    setFilter('all');
    setPlayerFilter('all');
    setRoundFilter('all');

    const timer = window.setTimeout(() => {
      driverRef.current?.destroy();
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
      const done = isMatchCompleted(m, tournament.targetPoints);
      if (filter === 'pending' && done) return false;
      if (filter === 'completed' && !done) return false;
      if (tournament.rounds === 2 && roundFilter !== 'all' && String(m.round) !== roundFilter) {
        return false;
      }
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
  }, [tournament.matches, tournament.rounds, filter, playerFilter, roundFilter]);

  const restingNames = useMemo(() => {
    if (nextSlotMatches.length === 0) return [];
    const restingIds = nextSlotMatches[0]?.restingIds || [];
    return restingIds.map((id) => playerMap.get(id) || id);
  }, [nextSlotMatches, playerMap]);

  return (
    <div>
      {nextSlotMatches.length > 0 ? (
        <section id="tour-current-court" className="highlight-card live-court-section">
          <div className="live-court-header">
            <div className="live-court-tags">
              <span className="live-indicator-pill">
                <span className="live-dot" aria-hidden="true" />
                EN CANCHA AHORA
              </span>
              {tournament.rounds === 2 && nextSlotMatches[0]?.round && (
                <span className="badge badge-primary">
                  Ronda {nextSlotMatches[0].round}
                </span>
              )}
              <span className="badge badge-neutral">
                {tournament.courts > 1
                  ? `Turno ${nextSlotMatches[0].slot}`
                  : `Juego #${nextSlotMatches[0].gameNumber}`}
              </span>
            </div>
            <div className="live-court-progress">
              {completedCount} / {totalMatches} juegos listos
            </div>
          </div>

          <div className="live-courts-grid">
            {nextSlotMatches.map((m) => {
              const manA = playerMap.get(m.teamA.manId) || m.teamA.manId;
              const womanA = playerMap.get(m.teamA.womanId) || m.teamA.womanId;
              const manB = playerMap.get(m.teamB.manId) || m.teamB.manId;
              const womanB = playerMap.get(m.teamB.womanId) || m.teamB.womanId;

              return (
                <div key={m.id} className="live-court-card">
                  <div className="live-court-card-header">
                    <span className="live-court-title">
                      <span className="live-court-icon" aria-hidden="true">🎾</span>
                      {tournament.courts > 1 ? `Cancha ${m.court}` : 'Cancha principal'}
                    </span>
                    <span className="live-court-game-badge">Juego #{m.gameNumber}</span>
                  </div>

                  <div className="live-court-matchup">
                    <div className="live-team-col live-team-left">
                      <div className="live-player-item" title={manA}>
                        <span className="live-gender-tag live-gender-tag-h" title="Hombre">H</span>
                        <span className="live-player-name">{manA}</span>
                      </div>
                      <div className="live-player-item" title={womanA}>
                        <span className="live-gender-tag live-gender-tag-m" title="Mujer">M</span>
                        <span className="live-player-name">{womanA}</span>
                      </div>
                    </div>

                    <div className="live-vs-divider">
                      <span className="live-vs-badge">VS</span>
                    </div>

                    <div className="live-team-col live-team-right">
                      <div className="live-player-item" title={manB}>
                        <span className="live-gender-tag live-gender-tag-h" title="Hombre">H</span>
                        <span className="live-player-name">{manB}</span>
                      </div>
                      <div className="live-player-item" title={womanB}>
                        <span className="live-gender-tag live-gender-tag-m" title="Mujer">M</span>
                        <span className="live-player-name">{womanB}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {restingNames.length > 0 && (
            <div className="live-resting-footer">
              <span className="live-resting-icon" aria-hidden="true">☕</span>
              <span className="live-resting-label">Descansan este turno:</span>
              <span className="live-resting-list">{restingNames.join(', ')}</span>
            </div>
          )}
        </section>
      ) : (
        <section id="tour-current-court" className="highlight-card highlight-card-finished">
          <div className="live-court-header" style={{ marginBottom: 0 }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '4px' }}>
                🎉 Fase clasificatoria completada
              </span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginTop: '4px' }}>
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
          targetPoints={tournament.targetPoints}
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

        {tournament.rounds === 2 && (
          <div className="pill-group" role="group" aria-label="Filtrar juegos por ronda">
            <button
              type="button"
              className={`pill-btn ${roundFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoundFilter('all')}
            >
              Todas las rondas
            </button>
            <button
              type="button"
              className={`pill-btn ${roundFilter === '1' ? 'active' : ''}`}
              onClick={() => setRoundFilter('1')}
            >
              Ronda 1
            </button>
            <button
              type="button"
              className={`pill-btn ${roundFilter === '2' ? 'active' : ''}`}
              onClick={() => setRoundFilter('2')}
            >
              Ronda 2
            </button>
          </div>
        )}

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
              showRoundBadge={tournament.rounds === 2}
              targetPoints={tournament.targetPoints}
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
