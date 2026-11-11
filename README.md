# Pickleball Round-Robin (Parejas)

Aplicación web estática para organizar torneos **todos contra todos por parejas**, alternando descansos automáticamente, registrando marcadores en vivo y calculando estadísticas finales con persistencia local en **`localStorage`**.

## Características

- **Registro flexible de parejas:** Carga rápida individual, pegado en bloque o plantillas de ejemplo (4, 5 o 6 parejas).
- **Calendario Round-Robin con descansos equilibrados:**
  - Garantiza que todas las parejas jueguen entre sí una vez.
  - Minimiza los juegos consecutivos en 1 cancha (0 juegos seguidos a partir de 5 parejas; orden alternado óptimo para 4 parejas) o distribuye turnos en múltiples canchas.
  - Indica explícitamente qué parejas descansan en cada juego/turno.
- **Captura rápida de puntajes y estadísticas en vivo:**
  - `PJ`, `PG`, `PP`, `% Vic`, `PF`, `PC`, `Dif` y `Prom PF` (promedio de puntos por juego).
  - Resumen automático de quién ganó más, quién ganó menos y mejor promedio ofensivo.
- **Persistencia local sin servidor:**
  - Guarda el torneo activo y el historial de torneos en `localStorage`.
  - Permite copiar el resumen formateado (ideal para WhatsApp) y exportar/importar respaldos `.json`.

## Comandos locales

```bash
npm install
npm run dev      # Inicia el servidor de desarrollo
npm test         # Ejecuta las pruebas unitarias de lógica y almacenamiento
npm run build    # Genera la carpeta dist/ lista para Netlify
```

## Despliegue en Netlify

El archivo `netlify.toml` ya está configurado para construir con `npm run build` y publicar la carpeta `dist/`. Puedes desplegar conectando el repositorio a Netlify o subiendo directamente la carpeta `dist/` generada tras `npm run build`.
