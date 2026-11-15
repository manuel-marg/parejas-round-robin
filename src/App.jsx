import React, { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { generateMixedRoundRobinSchedule } from './domain/scheduler.js';
import {
  computeIndividualStandings,
  computeSummary,
  resolveFinalMatch,
} from './domain/stats.js';
import {
  activateHelpSession,
  deleteHistoryEntry,
  formatShareableSummary,
  loadActiveTournament,
  loadTournamentHistory,
  loadTutorialState,
  markHistoryTourSeen,
  markMatchesTourSeen,
  markSetupTourSeen,
  markStatsTourSeen,
  markTournamentCompleted,
  saveActiveTournament,
  saveTournamentToHistory,
  shouldAutoStartHistoryTour,
  shouldAutoStartMatchesTour,
  shouldAutoStartSetupTour,
  shouldAutoStartStatsTour,
} from './domain/storage.js';
import SetupView from './components/SetupView.jsx';
import MatchesView from './components/MatchesView.jsx';
import StatsView from './components/StatsView.jsx';
import HistoryView from './components/HistoryView.jsx';
import WelcomeView from './components/WelcomeView.jsx';
import SavedTournamentsView from './components/SavedTournamentsView.jsx';
import { confirmNewTournament } from './utils/confirm.js';
import {
  goBackToWelcome,
  pushNavTab,
  pushNavView,
  resolveNavFromHash,
  syncInitialHistory,
  syncTournamentStart,
} from './utils/navigation.js';

/**
 * Componente raíz de la aplicación Pickleball (parejas mixtas rotativas).
 */
export default function App() {
  const [tournament, setTournament] = useState(() => loadActiveTournament());
  const [history, setHistory] = useState(() => loadTournamentHistory());
  const [tutorialState, setTutorialState] = useState(() => loadTutorialState());
  const [setupTourTick, setSetupTourTick] = useState(0);
  const [matchesTourTick, setMatchesTourTick] = useState(0);
  const [statsTourTick, setStatsTourTick] = useState(0);
  const [historyTourTick, setHistoryTourTick] = useState(0);

  const initialNav = useMemo(
    () =>
      resolveNavFromHash(
        typeof window !== 'undefined' ? window.location.hash : '',
        Boolean(tournament)
      ),
    []
  );
  const [activeTab, setActiveTab] = useState(initialNav.tab);
  const [initialViewMode, setInitialViewMode] = useState(initialNav.initialViewMode);

  const tournamentRef = useRef(tournament);
  tournamentRef.current = tournament;

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const initialViewModeRef = useRef(initialViewMode);
  initialViewModeRef.current = initialViewMode;

  useEffect(() => {
    saveActiveTournament(tournament);
  }, [tournament]);

  useEffect(() => {
    // Sincroniza la URL inicial si el usuario entra sin hash o recarga
    syncInitialHistory(Boolean(tournamentRef.current));

    function handlePopState() {
      // Si hay un modal SweetAlert2 abierto, cerrarlo al navegar atrás
      if (typeof Swal !== 'undefined' && Swal.isVisible?.()) {
        Swal.close();
      }

      const hasTournament = Boolean(tournamentRef.current);
      const resolved = resolveNavFromHash(window.location.hash, hasTournament);

      if (hasTournament) {
        if (resolved.isPreTournamentHash) {
          // Si el usuario estaba en la raíz del torneo (#matches) y le dio atrás hacia un hash previo (#welcome/#setup/#saved),
          // forzamos el retroceso para que continúe saliendo hacia la web previa de forma natural
          window.history.back();
          return;
        }
        setActiveTab(resolved.tab);
      } else {
        setInitialViewMode(resolved.initialViewMode);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, initialViewMode]);

  const standings = useMemo(() => {
    if (!tournament) return { women: [], men: [], all: [] };
    return computeIndividualStandings(
      tournament.players,
      tournament.matches,
      tournament.targetPoints
    );
  }, [tournament]);

  const finalMatchResolved = useMemo(() => {
    if (!tournament) return null;
    return resolveFinalMatch(
      standings,
      tournament.finalMatch,
      tournament.targetPoints
    );
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
    return computeSummary(
      standings,
      tournament.matches,
      tournament.finalMatch,
      tournament.targetPoints
    );
  }, [tournament, standings]);

  const whatsappHref = useMemo(() => {
    if (!tournament) return '#';
    const text = formatShareableSummary(tournament, standings, finalMatchResolved);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [tournament, standings, finalMatchResolved]);

  useEffect(() => {
    if (summary.isFinished && !tutorialState.tournamentCompleted) {
      setTutorialState(markTournamentCompleted());
    }
  }, [summary.isFinished, tutorialState.tournamentCompleted]);

  function handleNavigateView(mode, options) {
    pushNavView(mode, options);
    setInitialViewMode(mode);
  }

  function handleNavigateTab(tab) {
    pushNavTab(tab, activeTabRef.current);
    setActiveTab(tab);
  }

  function handleBackNav() {
    goBackToWelcome(() => setInitialViewMode('welcome'));
  }

  function handleExitTournamentToWelcome() {
    setTournament(null);
    pushNavView('welcome', { replace: true });
    setInitialViewMode('welcome');
  }

  function handleStartTournament({ title, players, courts, targetPoints, rounds = 1 }) {
    const { matches, meta } = generateMixedRoundRobinSchedule(players, { courts, rounds });
    setTournament({
      id: `torneo-${Date.now()}`,
      title,
      courts: meta.courts,
      targetPoints,
      rounds: meta.rounds || rounds || 1,
      players,
      matches,
      finalMatch: {
        pairingMode: 'crossed',
        scoreA: null,
        scoreB: null,
      },
      meta,
    });
    syncTournamentStart();
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
    handleNavigateTab('matches');
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
      rounds: entry.rounds || entry.meta?.rounds || 1,
      players: entry.players,
      matches: entry.matches,
      finalMatch: entry.finalMatch || { pairingMode: 'crossed', scoreA: null, scoreB: null },
      meta: entry.meta || null,
    });
    syncTournamentStart();
    setActiveTab('matches');
  }

  function handleDeleteHistory(entryId) {
    const next = deleteHistoryEntry(entryId);
    setHistory(next);
  }

  async function handleNewTournamentPrompt() {
    const confirmed = await confirmNewTournament();
    if (confirmed) {
      handleExitTournamentToWelcome();
    }
  }

  function handleHelpClick() {
    const nextState = activateHelpSession();
    setTutorialState(nextState);

    if (!tournament) {
      handleNavigateView('setup');
      setSetupTourTick((t) => t + 1);
    } else if (activeTab === 'matches') {
      setMatchesTourTick((t) => t + 1);
    } else if (activeTab === 'stats') {
      setStatsTourTick((t) => t + 1);
    } else if (activeTab === 'history') {
      setHistoryTourTick((t) => t + 1);
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
              <button
                type="button"
                className="btn btn-header-ghost"
                onClick={handleHelpClick}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">
                  help
                </span>
                <span>Ayuda</span>
              </button>
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
                {womenCount} {womenCount === 1 ? 'mujer' : 'mujeres'} · {menCount} {menCount === 1 ? 'hombre' : 'hombres'}
                {tournament.rounds === 2 ? ' · 2 rondas' : ''} · {summary.completedMatches} de {summary.totalMatches} juegos · A {tournament.targetPoints || 11} pts
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="main-container">
        {!tournament ? (
          initialViewMode === 'setup' ? (
            <SetupView
              onStartTournament={handleStartTournament}
              history={history}
              onLoadHistory={handleLoadHistory}
              onBackToWelcome={handleBackNav}
              autoStartTour={shouldAutoStartSetupTour(tutorialState)}
              manualTourTick={setupTourTick}
              onSetupTourComplete={() => setTutorialState(markSetupTourSeen())}
            />
          ) : initialViewMode === 'saved' ? (
            <SavedTournamentsView
              history={history}
              onBackToWelcome={handleBackNav}
              onCreateTournament={() => handleNavigateView('setup')}
              onLoadHistory={handleLoadHistory}
              onDeleteHistory={handleDeleteHistory}
            />
          ) : (
            <WelcomeView
              onCreateTournament={() => handleNavigateView('setup')}
              onOpenSaved={() => handleNavigateView('saved')}
              savedCount={history.length}
            />
          )
        ) : (
          <>
            <div className="tabs-bar">
              <div className="tabs-group" role="tablist" aria-label="Secciones del torneo">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'matches'}
                  className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
                  onClick={() => handleNavigateTab('matches')}
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
                  onClick={() => handleNavigateTab('stats')}
                >
                  <span>Posiciones</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => handleNavigateTab('history')}
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
                onGoToStats={() => handleNavigateTab('stats')}
                autoStartTour={shouldAutoStartMatchesTour(tutorialState)}
                manualTourTick={matchesTourTick}
                onMatchesTourComplete={() => setTutorialState(markMatchesTourSeen())}
                whatsappHref={whatsappHref}
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
                onGoToMatches={() => handleNavigateTab('matches')}
                onResetScores={handleResetScores}
                onNewTournament={handleExitTournamentToWelcome}
                autoStartTour={shouldAutoStartStatsTour(tutorialState)}
                manualTourTick={statsTourTick}
                onStatsTourComplete={() => setTutorialState(markStatsTourSeen())}
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
                onNewTournament={handleExitTournamentToWelcome}
                autoStartTour={shouldAutoStartHistoryTour(tutorialState)}
                manualTourTick={historyTourTick}
                onHistoryTourComplete={() => setTutorialState(markHistoryTourSeen())}
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
            onClick={() => handleNavigateTab('matches')}
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
            onClick={() => handleNavigateTab('stats')}
          >
            <span className="material-symbols-outlined mobile-nav-icon" aria-hidden="true">
              leaderboard
            </span>
            <span>Posiciones</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleNavigateTab('history')}
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
