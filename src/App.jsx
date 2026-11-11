import React, { useEffect, useMemo, useState } from 'react';
import { generateRoundRobinSchedule } from './domain/scheduler.js';
import { computeStandings, computeSummary } from './domain/stats.js';
import {
  deleteHistoryEntry,
  loadActiveTournament,
  loadTournamentHistory,
  parseImportedTournament,
  saveActiveTournament,
  saveTournamentToHistory,
} from './domain/storage.js';
import SetupView from './components/SetupView.jsx';
import MatchesView from './components/MatchesView.jsx';
import StatsView from './components/StatsView.jsx';
import HistoryView from './components/HistoryView.jsx';

/**
 * Componente raíz de la aplicación Pickleball Round-Robin con persistencia en localStorage.
 */
export default function App() {
  const [tournament, setTournament] = useState(() => loadActiveTournament());
  const [history, setHistory] = useState(() => loadTournamentHistory());
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    saveActiveTournament(tournament);
  }, [tournament]);

  const standings = useMemo(() => {
    if (!tournament) return [];
    return computeStandings(tournament.pairs, tournament.matches);
  }, [tournament]);

  const summary = useMemo(() => {
    if (!tournament) {
      return {
        totalMatches: 0,
        completedMatches: 0,
        progressPct: 0,
        isFinished: false,
        topWinners: [],
        lowestWinners: [],
        bestAttack: null,
        bestDiff: null,
      };
    }
    return computeSummary(standings, tournament.matches);
  }, [tournament, standings]);

  function handleStartTournament({ title, pairs, courts, targetPoints }) {
    const { matches, meta } = generateRoundRobinSchedule(pairs, { courts });
    setTournament({
      id: `torneo-${Date.now()}`,
      title,
      courts: meta.courts,
      targetPoints,
      pairs,
      matches,
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

  function handleResetScores() {
    setTournament((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: prev.matches.map((m) => ({ ...m, scoreA: null, scoreB: null })),
      };
    });
    setActiveTab('matches');
  }

  function handleSaveToHistory() {
    if (!tournament) return;
    const next = saveTournamentToHistory(tournament, standings);
    setHistory(next);
  }

  function handleLoadHistory(entry) {
    setTournament({
      id: entry.id,
      title: entry.title,
      courts: entry.courts || 1,
      targetPoints: entry.targetPoints || 11,
      pairs: entry.pairs,
      matches: entry.matches,
      meta: entry.meta || null,
    });
    setActiveTab('matches');
  }

  function handleDeleteHistory(entryId) {
    const next = deleteHistoryEntry(entryId);
    setHistory(next);
  }

  function handleImportJson(rawText) {
    const imported = parseImportedTournament(rawText);
    setTournament(imported);
    setActiveTab('matches');
  }

  function handleNewTournamentPrompt() {
    if (window.confirm('¿Volver a la configuración para crear un torneo nuevo?')) {
      setTournament(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div style={{ minWidth: 0 }}>
            <h1 className="brand-title">
              <span>🎾</span>
              <span>{tournament ? tournament.title : 'Pickleball Round-Robin'}</span>
            </h1>
            <p className="brand-subtitle">
              {tournament
                ? `${tournament.pairs.length} parejas · ${summary.completedMatches}/${summary.totalMatches} juegos · A ${tournament.targetPoints || 11} pts`
                : 'Todos contra todos por parejas con descansos y estadísticas'}
            </p>
          </div>

          <div className="header-actions">
            <div className="storage-pill" title="Los datos se guardan automáticamente en localStorage">
              <span className="storage-dot" aria-hidden="true" />
              <span>
                Local<span className="storage-label-full"> (localStorage)</span>
              </span>
            </div>
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
      </header>

      <main className="main-container">
        {!tournament ? (
          <SetupView
            onStartTournament={handleStartTournament}
            history={history}
            onLoadHistory={handleLoadHistory}
            onImportJson={handleImportJson}
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
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'stats'}
                  className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <span>Estadísticas</span>
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
                onScoreChange={handleScoreChange}
                onClearMatch={handleClearMatch}
                onGoToStats={() => setActiveTab('stats')}
              />
            )}

            {activeTab === 'stats' && (
              <StatsView
                tournament={tournament}
                standings={standings}
                summary={summary}
                onSaveToHistory={handleSaveToHistory}
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
                onImportJson={handleImportJson}
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
            <span className="mobile-nav-icon" aria-hidden="true">🎾</span>
            <span>Juegos ({summary.completedMatches}/{summary.totalMatches})</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="mobile-nav-icon" aria-hidden="true">📊</span>
            <span>Estadísticas</span>
          </button>
          <button
            type="button"
            className={`mobile-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="mobile-nav-icon" aria-hidden="true">🗂️</span>
            <span>Historial</span>
          </button>
        </nav>
      )}
    </div>
  );
}
