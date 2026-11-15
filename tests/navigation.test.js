import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHash,
  resolveNavFromHash,
  PRE_TOURNAMENT_MODES,
  DEFAULT_PRE_TOURNAMENT_MODE,
  TOURNAMENT_TABS,
  DEFAULT_TOURNAMENT_TAB,
} from '../src/utils/navigation.js';

test('parseHash limpia correctamente prefijos y sufijos de hash', () => {
  assert.equal(parseHash(''), '');
  assert.equal(parseHash('#'), '');
  assert.equal(parseHash('#/'), '');
  assert.equal(parseHash('#setup'), 'setup');
  assert.equal(parseHash('#/setup'), 'setup');
  assert.equal(parseHash('#/setup/'), 'setup');
  assert.equal(parseHash('#SAVED'), 'saved');
  assert.equal(parseHash('#/Stats/'), 'stats');
  assert.equal(parseHash(null), '');
  assert.equal(parseHash(undefined), '');
});

test('resolveNavFromHash resuelve vistas previas al torneo cuando no hay torneo activo', () => {
  const hasTournament = false;

  // Hash vacío o no reconocido va al menú inicial 'welcome'
  assert.deepEqual(resolveNavFromHash('', hasTournament), {
    view: 'welcome',
    tab: 'matches',
    initialViewMode: 'welcome',
    isPreTournamentHash: false,
  });
  assert.deepEqual(resolveNavFromHash('#unknown', hasTournament), {
    view: 'welcome',
    tab: 'matches',
    initialViewMode: 'welcome',
    isPreTournamentHash: false,
  });

  // Hash #setup va a la vista de configuración
  assert.deepEqual(resolveNavFromHash('#setup', hasTournament), {
    view: 'setup',
    tab: 'matches',
    initialViewMode: 'setup',
    isPreTournamentHash: true,
  });
  assert.deepEqual(resolveNavFromHash('#/setup', hasTournament), {
    view: 'setup',
    tab: 'matches',
    initialViewMode: 'setup',
    isPreTournamentHash: true,
  });

  // Hash #saved va a la vista de torneos guardados
  assert.deepEqual(resolveNavFromHash('#saved', hasTournament), {
    view: 'saved',
    tab: 'matches',
    initialViewMode: 'saved',
    isPreTournamentHash: true,
  });
  assert.deepEqual(resolveNavFromHash('#/saved', hasTournament), {
    view: 'saved',
    tab: 'matches',
    initialViewMode: 'saved',
    isPreTournamentHash: true,
  });
});

test('resolveNavFromHash resuelve pestañas de torneo cuando hay un torneo activo', () => {
  const hasTournament = true;

  // Por defecto si el hash está vacío o es desconocido, va a 'matches'
  assert.deepEqual(resolveNavFromHash('', hasTournament), {
    view: 'tournament',
    tab: 'matches',
    initialViewMode: 'welcome',
    isPreTournamentHash: false,
  });
  assert.deepEqual(resolveNavFromHash('#unknown', hasTournament), {
    view: 'tournament',
    tab: 'matches',
    initialViewMode: 'welcome',
    isPreTournamentHash: false,
  });

  // Pestañas válidas: matches, stats, history
  assert.deepEqual(resolveNavFromHash('#matches', hasTournament), {
    view: 'tournament',
    tab: 'matches',
    initialViewMode: 'welcome',
    isPreTournamentHash: false,
  });
  assert.deepEqual(resolveNavFromHash('#stats', hasTournament), {
    view: 'tournament',
    tab: 'stats',
    initialViewMode: 'welcome',
    isPreTournamentHash: false,
  });
  assert.deepEqual(resolveNavFromHash('#history', hasTournament), {
    view: 'tournament',
    tab: 'history',
    initialViewMode: 'welcome',
    isPreTournamentHash: false,
  });

  // Si hay torneo y el hash es #welcome o #setup, isPreTournamentHash es true
  assert.deepEqual(resolveNavFromHash('#welcome', hasTournament), {
    view: 'tournament',
    tab: 'matches',
    initialViewMode: 'welcome',
    isPreTournamentHash: true,
  });
  assert.deepEqual(resolveNavFromHash('#setup', hasTournament), {
    view: 'tournament',
    tab: 'matches',
    initialViewMode: 'welcome',
    isPreTournamentHash: true,
  });
});

test('constantes de vistas y pestañas están definidas correctamente', () => {
  assert.ok(PRE_TOURNAMENT_MODES.includes('welcome'));
  assert.ok(PRE_TOURNAMENT_MODES.includes('setup'));
  assert.ok(PRE_TOURNAMENT_MODES.includes('saved'));
  assert.equal(DEFAULT_PRE_TOURNAMENT_MODE, 'welcome');

  assert.ok(TOURNAMENT_TABS.includes('matches'));
  assert.ok(TOURNAMENT_TABS.includes('stats'));
  assert.ok(TOURNAMENT_TABS.includes('history'));
  assert.equal(DEFAULT_TOURNAMENT_TAB, 'matches');
});
