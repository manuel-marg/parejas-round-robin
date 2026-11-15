import React from 'react';

/**
 * Menú inicial de bienvenida cuando no hay ningún torneo activo en curso.
 * Presenta opciones claras y atractivas para crear un torneo o ver los guardados.
 */
export default function WelcomeView({
  onCreateTournament,
  onOpenSaved,
  savedCount = 0,
}) {
  return (
    <div className="welcome-container">
      {/* Cabecera / Hero de bienvenida */}
      <section className="card welcome-hero-card">
        <div className="welcome-hero-content">
          <div className="welcome-hero-icon-badge" aria-hidden="true">
            <span className="material-symbols-outlined" style={{ fontSize: '38px' }}>
              sports_tennis
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="welcome-hero-title">Pickleball · Parejas Rotativas</h1>
            <p className="welcome-hero-subtitle">
              Organiza partidos todos contra todos con parejas mixtas rotativas, anota marcadores en vivo y comparte las posiciones oficiales.
            </p>
          </div>
        </div>
      </section>

      {/* Menú de acciones principales */}
      <div className="welcome-actions-stack">
        {/* Botón 1: Crear nuevo torneo */}
        <button
          type="button"
          className="welcome-action-card welcome-action-primary"
          onClick={onCreateTournament}
        >
          <div className="welcome-action-icon-wrap primary" aria-hidden="true">
            <span className="material-symbols-outlined">add_circle</span>
          </div>
          <div className="welcome-action-text">
            <span className="welcome-action-title">Crear nuevo torneo</span>
            <span className="welcome-action-desc">
              Registra jugadoras y jugadores, configura las canchas y genera el rol de partidos automáticamente.
            </span>
          </div>
          <span className="material-symbols-outlined welcome-action-arrow" aria-hidden="true">
            chevron_right
          </span>
        </button>

        {/* Botón 2: Ver torneos guardados */}
        <button
          type="button"
          className="welcome-action-card welcome-action-secondary"
          onClick={onOpenSaved}
        >
          <div className="welcome-action-icon-wrap secondary" aria-hidden="true">
            <span className="material-symbols-outlined">history</span>
          </div>
          <div className="welcome-action-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="welcome-action-title">Ver torneos guardados</span>
              <span className={`badge ${savedCount > 0 ? 'badge-primary' : 'badge-neutral'}`}>
                {savedCount > 0 ? `${savedCount} ${savedCount === 1 ? 'guardado' : 'guardados'}` : '0 guardados'}
              </span>
            </div>
            <span className="welcome-action-desc">
              Consulta podios anteriores, revisa resultados o vuelve a cargar un torneo guardado en este dispositivo.
            </span>
          </div>
          <span className="material-symbols-outlined welcome-action-arrow" aria-hidden="true">
            chevron_right
          </span>
        </button>
      </div>

      {/* Mini tarjetas informativas con las ventajas del sistema */}
      <div className="welcome-features-grid">
        <div className="welcome-feature-item">
          <span className="material-symbols-outlined welcome-feature-icon" aria-hidden="true">
            repeat
          </span>
          <div>
            <div className="welcome-feature-title">Sin parejas fijas</div>
            <div className="welcome-feature-desc">Cada jugador rota y juega con un compañero del sexo opuesto distinto en cada turno.</div>
          </div>
        </div>

        <div className="welcome-feature-item">
          <span className="material-symbols-outlined welcome-feature-icon" aria-hidden="true">
            scoreboard
          </span>
          <div>
            <div className="welcome-feature-title">Marcadores en vivo</div>
            <div className="welcome-feature-desc">Anota puntos fácilmente y visualiza en tiempo real qué parejas están en cancha.</div>
          </div>
        </div>

        <div className="welcome-feature-item">
          <span className="material-symbols-outlined welcome-feature-icon" aria-hidden="true">
            trophy
          </span>
          <div>
            <div className="welcome-feature-title">Gran Final automática</div>
            <div className="welcome-feature-desc">Calcula posiciones y clasifica a las 2 mejores mujeres y 2 mejores hombres.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
