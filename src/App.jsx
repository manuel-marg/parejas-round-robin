import React, { useEffect, useMemo, useState } from 'react';
import { generateMixedRoundRobinSchedule } from './domain/scheduler.js';
import {
  computeIndividualStandings,
  computeSummary,
  resolveFinalMatch,
} from './domain/stats.js';
import {
  deleteHistoryEntry,
  loadActiveTournament,
  loadTournamentHistory,
  loadTutorialState,
  markMatchesTourSeen,
  markSetupTourSeen,
  markTournamentCompleted,
  saveActiveTournament,
  saveTournamentToHistory,
  shouldAutoStartMatchesTour,
  shouldAutoStartSetupTour,
} from './domain/storage.js';
import SetupView from './components/SetupView.jsx';
import MatchesView from './components/MatchesView.jsx';
import StatsView from './components/StatsView.jsx';
import HistoryView from './components/HistoryView.jsx';

/**
 * Componente raíz de la aplicación Pickleball (parejas mixtas rotativas).
 */
export default function App() {
  const [tournament, setTournament] = useState(() => loadActiveTournament());
  const [history, setHistory] = useState(() => loadTournamentHistory());
  const [tutorialState, setTutorialState] = useState(() => loadTutorialState());
  const [setupTourTick, setSetupTourTick] = useState(0);
  const [matchesTourTick, setMatchesTourTick] = useState(0);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    saveActiveTournament(tournament);
  }, [tournament]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const standings = useMemo(() => {
    if (!tournament) return { women: [], men: [], all: [] };
    return computeIndividualStandings(tournament.players, tournament.matches);
  }, [tournament]);

  const finalMatchResolved = useMemo(() => {
    if (!tournament) return null;
    return resolveFinalMatch(standings, tournament.finalMatch);
  }, [tournament, standings]);

  const summary = useMemo(() => {
    if (!tournament) {
      return {
        totalMatches: 0,
        completedMatches: 0,
        progressPct: 0,
        isFinished: false,
        isFinalCompleted: false,
        topWomen: [],
        topMen: [],
      };
    }
    return computeSummary(standings, tournament.matches, tournament.finalMatch);
  }, [tournament, standings]);

  useEffect(() => {
    if (summary.isFinished && !tutorialState.tournamentCompleted) {
      setTutorialState(markTournamentCompleted());
    }
  }, [summary.isFinished, tutorialState.tournamentCompleted]);

  function handleStartTournament({ title, players, courts, targetPoints }) {
    const { matches, meta } = generateMixedRoundRobinSchedule(players, { courts });
    setTournament({
      id: `torneo-${Date.now()}`,
      title,
      courts: meta.courts,
      targetPoints,
      players,
      matches,
      finalMatch: {
        pairingMode: 'crossed',
        scoreA: null,
        scoreB: null,
      },
      meta,
    });
    setActiveTab('matches');
  }

  function handleScoreChange(matchId, side, value) {
    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === matchId ? { ...m, [side]: value } : m
        ),
      };
    });
  }

  function handleClearMatch(matchId) {
    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === matchId ? { ...m, scoreA: null, scoreB: null } : m
        ),
      };
    });
  }

  function handleFinalScoreChange(side, value) {
    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        finalMatch: {
          pairingMode: prev.finalMatch?.pairingMode || 'crossed',
          scoreA: prev.finalMatch?.scoreA ?? null,
          scoreB: prev.finalMatch?.scoreB ?? null,
          [side]: value,
        },
      };
    });
  }

  function handleFinalPairingChange(pairingMode) {
    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        finalMatch: {
          scoreA: prev.finalMatch?.scoreA ?? null,
          scoreB: prev.finalMatch?.scoreB ?? null,
          pairingMode,
        },
      };
    });
  }

  function handleClearFinal() {
    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        finalMatch: {
          pairingMode: prev.finalMatch?.pairingMode || 'crossed',
          scoreA: null,
          scoreB: null,
        },
      };
    });
  }

  function handleResetScores() {
    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: prev.matches.map((m) => ({ ...m, scoreA: null, scoreB: null })),
        finalMatch: {
          pairingMode: prev.finalMatch?.pairingMode || 'crossed',
          scoreA: null,
          scoreB: null,
        },
      };
    });
    setActiveTab('matches');
  }

  function handleSaveToHistory() {
    if (!tournament) return;
    const next = saveTournamentToHistory(tournament, standings, finalMatchResolved);
    setHistory(next);
  }

  function handleLoadHistory(entry) {
    setTournament({
      id: entry.id,
      title: entry.title,
      courts: entry.courts || 1,
      targetPoints: entry.targetPoints || 11,
      players: entry.players,
      matches: entry.matches,
      finalMatch: entry.finalMatch || { pairingMode: 'crossed', scoreA: null, scoreB: null },
      meta: entry.meta || null,
    });
    setActiveTab('matches');
  }

  function handleDeleteHistory(entryId) {
    const next = deleteHistoryEntry(entryId);
    setHistory(next);
  }

  function handleNewTournamentPrompt() {
    if (window.confirm('¿Volver a la configuración para crear un torneo nuevo?')) {
      setTournament(null);
    }
  }

  const womenCount = tournament ? tournament.players.filter((p) => p.gender === 'M').length : 0;
  const menCount = tournament ? tournament.players.filter((p) => p.gender === 'H').length : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-top-row">
            <h1 className="brand-title">
              <span className="material-symbols-outlined brand-icon" aria-hidden="true">
                pickleball
              </span>
              <span className="brand-name">Pickleball</span>
            </h1>

            <div className="header-actions">
              {(!tournament || activeTab === 'matches') && (
                <button
                  type="button"
                  className="btn btn-header-ghost"
                  onClick={() => {
                    if (!tournament) {
                      setSetupTourTick((t) => t + 1);
                    } else {
                      setMatchesTourTick((t) => t + 1);
                    }
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">
                    help
                  </span>
                  <span>Guía</span>
                </button>
              )}
              {tournament && (
                <button
                  type="button"
                  className="btn btn-header-ghost"
                  onClick={handleNewTournamentPrompt}
                >
                  + Nuevo
                </button>
              )}
            </div>
          </div>

          {tournament && (
            <div className="header-meta-row">
              <p className="header-meta-text">
                {tournament.title && tournament.title !== 'Pickleball' && (
                  <strong>{tournament.title} · </strong>
                )}
                {womenCount} {womenCount === 1 ? 'mujer' : 'mujeres'} · {menCount} {menCount === 1 ? 'hombre' : 'hombres'} · {summary.completedMatches} de {summary.totalMatches} juegos · A {tournament.targetPoints || 11} pts
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="main-container">
        {!tournament ? (
          <SetupView
            onStartTournament={handleStartTournament}
            history={history}
            onLoadHistory={handleLoadHistory}
            autoStartTour={shouldAutoStartSetupTour(tutorialState)}
            manualTourTick={setupTourTick}
            onSetupTourComplete={() => setTutorialState(markSetupTourSeen())}
          />
        ) : (
          <>
            <div className="tabs-bar">
              <div className="tabs-group" role="tablist" aria-label="Secciones del torneo">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'matches'}
                  className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
                  onClick={() => setActiveTab('matches')}
                >
                  <span>Juegos</span>
                  <span
                    className="badge"
                    style={{
                      background: activeTab === 'matches' ? 'rgba(255,255,255,0.22)' : 'var(--primary-soft)',
                      color: activeTab === 'matches' ? '#ffffff' : 'var(--primary)',
                    }}
                  >
                    {summary.completedMatches}/{summary.totalMatches}
                  </span>
                </button>
                <button
                  id="tour-stats-tab-desktop"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'stats'}
                  className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <span>Promedios</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <span>Historial y Opciones</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleNewTournamentPrompt}
              >
                + Nuevo torneo
              </button>
            </div>

            {activeTab === 'matches' && (
              <MatchesView
                tournament={tournament}
                finalMatchResolved={finalMatchResolved}
                onScoreChange={handleScoreChange}
                onClearMatch={handleClearMatch}
                onFinalScoreChange={handleFinalScoreChange}
                onFinalPairingChange={handleFinalPairingChange}
                onClearFinal={handleClearFinal}
                onGoToStats={() => setActiveTab('stats')}
                autoStartTour={shouldAutoStartMatchesTour(tutorialState)}
                manualTourTick={matchesTourTick}
                onMatchesTourComplete={() => setTutorialState(markMatchesTourSeen())}
              />
            )}

            {activeTab === 'stats' && (
              <StatsView
                tournament={tournament}
                standings={standings}
                summary={summary}
                finalMatchResolved={finalMatchResolved}
                onFinalScoreChange={handleFinalScoreChange}
                onFinalPairingChange={handleFinalPairingChange}
                onClearFinal={handleClearFinal}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                tournament={tournament}
                history={history}
                onSaveToHistory={handleSaveToHistory}
                onLoadHistory={handleLoadHistory}
                onDeleteHistory={handleDeleteHistory}
                onResetScores={handleResetScores}
                onNewTournament={() => setTournament(null)}
              />
            )}
          </>
        )}
      </main>

      {tournament && (
        <nav className="mobile-bottom-nav" aria-label="Navegación móvil del torneo">
          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <span className="material-symbols-outlined mobile-nav-icon" aria-hidden="true">
              pickleball
            </span>
            <span>Juegos ({summary.completedMatches}/{summary.totalMatches})</span>
          </button>
          <button
            id="tour-stats-tab-mobile"
            type="button"
            className={`mobile-nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="material-symbols-outlined mobile-nav-icon" aria-hidden="true">
              leaderboard
            </span>
            <span>Promedios</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="material-symbols-outlined mobile-nav-icon" aria-hidden="true">
              history
            </span>
            <span>Historial</span>
          </button>
        </nav>
      )}
    </div>
  );
}
