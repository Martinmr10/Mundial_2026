// ═══════════════════════════════════════════════════════
//  MUNDIAL 2026 — DATOS COMPLETOS CON HORARIOS
//  Horarios en UTC para bloqueo automático de picks
//  (Ecuador = UTC-5, así que 14:00 UTC = 09:00 ECT)
// ═══════════════════════════════════════════════════════

const ADMIN_PASSWORD = "mundial2026admin"; // Cambia esto

const PHASES = [
  { id: "grupos", label: "Fase de Grupos" },
  { id: "r32",    label: "Dieciseisavos" },
  { id: "r16",    label: "Octavos de Final" },
  { id: "cuartos",label: "Cuartos de Final" },
  { id: "semi",   label: "Semifinales" },
  { id: "final",  label: "Final" },
];

// Banderas por país
const FLAGS = {
  "México": "🇲🇽", "Sudáfrica": "🇿🇦", "Corea del Sur": "🇰🇷",
  "Canadá": "🇨🇦", "Qatar": "🇶🇦", "Suiza": "🇨🇭",
  "Brasil": "🇧🇷", "Marruecos": "🇲🇦", "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Australia": "🇦🇺", "Arabia S.": "🇸🇦", "España": "🇪🇸", "Senegal": "🇸🇳",
  "EE.UU.": "🇺🇸", "Paraguay": "🇵🇾", "Nigeria": "🇳🇬", "Albania": "🇦🇱",
  "Croacia": "🇭🇷", "Portugal": "🇵🇹", "Hungría": "🇭🇺", "Nueva Zelanda": "🇳🇿",
  "Bélgica": "🇧🇪", "Argelia": "🇩🇿", "Japón": "🇯🇵", "Ecuador": "🇪🇨",
  "Costa de Marfil": "🇨🇮", "Túnez": "🇹🇳", "Uruguay": "🇺🇾",
  "Argentina": "🇦🇷", "Jordania": "🇯🇴", "Alemania": "🇩🇪", "Dinamarca": "🇩🇰",
  "Francia": "🇫🇷", "Camerún": "🇨🇲", "Colombia": "🇨🇴", "Uzbekistán": "🇺🇿",
  "Serbia": "🇷🇸", "Países Bajos": "🇳🇱", "Polonia": "🇵🇱", "Venezuela": "🇻🇪",
  "Irlanda": "🇮🇪", "Turquía": "🇹🇷", "Rumanía": "🇷🇴", "Chile": "🇨🇱",
  "Angola": "🇦🇴", "Ghana": "🇬🇭", "Bosnia": "🇧🇦", "Irak": "🇮🇶",
  "Suecia": "🇸🇪", "Congo DR": "🇨🇩", "Perú": "🇵🇪", "Indonesia": "🇮🇩",
  "Rep. Checa": "🇨🇿", "Irán": "🇮🇷", "Honduras": "🇭🇳", "Panamá": "🇵🇦",
  "Costa Rica": "🇨🇷", "Serbia": "🇷🇸", "Eslovenia": "🇸🇮", "Egipto": "🇪🇬",
};

// ── Función para verificar si un partido está bloqueado ──
// kickoff: string ISO "2026-06-11T19:00:00Z" (UTC)
function isMatchLocked(kickoffUTC) {
  if (!kickoffUTC) return false;
  return Date.now() >= new Date(kickoffUTC).getTime();
}

function formatKickoff(kickoffUTC) {
  if (!kickoffUTC) return "";
  const d = new Date(kickoffUTC);
  return d.toLocaleString("es-EC", {
    timeZone: "America/Guayaquil",
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// ── PARTIDOS FASE DE GRUPOS ──────────────────────────────
// Horarios en UTC. Ecuador (Guayaquil) = UTC-5
// 18:00 UTC = 13:00 ECT | 20:00 UTC = 15:00 ECT
// 23:00 UTC = 18:00 ECT | 01:00 UTC+1d = 20:00 ECT

const ALL_MATCHES = [

  // ── GRUPO A ──────────────────────────────────────────
  { id:"GA1", phase:"grupos", group:"Grupo A", team1:"México",       team2:"Sudáfrica",    kickoff:"2026-06-11T18:00:00Z" },
  { id:"GA2", phase:"grupos", group:"Grupo A", team1:"Corea del Sur",team2:"Rep. Checa",   kickoff:"2026-06-11T01:00:00Z" },
  { id:"GA3", phase:"grupos", group:"Grupo A", team1:"Rep. Checa",   team2:"Sudáfrica",    kickoff:"2026-06-18T23:00:00Z" },
  { id:"GA4", phase:"grupos", group:"Grupo A", team1:"México",       team2:"Corea del Sur",kickoff:"2026-06-19T00:00:00Z" },
  { id:"GA5", phase:"grupos", group:"Grupo A", team1:"Rep. Checa",   team2:"México",       kickoff:"2026-06-25T00:00:00Z" },
  { id:"GA6", phase:"grupos", group:"Grupo A", team1:"Sudáfrica",    team2:"Corea del Sur",kickoff:"2026-06-25T00:00:00Z" },

  // ── GRUPO B ──────────────────────────────────────────
  { id:"GB1", phase:"grupos", group:"Grupo B", team1:"Canadá",       team2:"Bosnia",       kickoff:"2026-06-12T18:00:00Z" },
  { id:"GB2", phase:"grupos", group:"Grupo B", team1:"Qatar",        team2:"Suiza",        kickoff:"2026-06-13T18:00:00Z" },
  { id:"GB3", phase:"grupos", group:"Grupo B", team1:"Suiza",        team2:"Bosnia",       kickoff:"2026-06-18T18:00:00Z" },
  { id:"GB4", phase:"grupos", group:"Grupo B", team1:"Canadá",       team2:"Qatar",        kickoff:"2026-06-18T21:00:00Z" },
  { id:"GB5", phase:"grupos", group:"Grupo B", team1:"Bosnia",       team2:"Qatar",        kickoff:"2026-06-24T00:00:00Z" },
  { id:"GB6", phase:"grupos", group:"Grupo B", team1:"Suiza",        team2:"Canadá",       kickoff:"2026-06-24T00:00:00Z" },

  // ── GRUPO C ──────────────────────────────────────────
  { id:"GC1", phase:"grupos", group:"Grupo C", team1:"Brasil",       team2:"Marruecos",    kickoff:"2026-06-13T20:00:00Z" },
  { id:"GC2", phase:"grupos", group:"Grupo C", team1:"Haití",        team2:"Escocia",      kickoff:"2026-06-13T23:00:00Z" },
  { id:"GC3", phase:"grupos", group:"Grupo C", team1:"Escocia",      team2:"Marruecos",    kickoff:"2026-06-19T23:00:00Z" },
  { id:"GC4", phase:"grupos", group:"Grupo C", team1:"Brasil",       team2:"Haití",        kickoff:"2026-06-20T00:00:00Z" },
  { id:"GC5", phase:"grupos", group:"Grupo C", team1:"Escocia",      team2:"Brasil",       kickoff:"2026-06-26T00:00:00Z" },
  { id:"GC6", phase:"grupos", group:"Grupo C", team1:"Marruecos",    team2:"Haití",        kickoff:"2026-06-26T00:00:00Z" },

  // ── GRUPO D ──────────────────────────────────────────
  { id:"GD1", phase:"grupos", group:"Grupo D", team1:"Australia",    team2:"Arabia S.",    kickoff:"2026-06-14T18:00:00Z" },
  { id:"GD2", phase:"grupos", group:"Grupo D", team1:"España",       team2:"Senegal",      kickoff:"2026-06-14T21:00:00Z" },
  { id:"GD3", phase:"grupos", group:"Grupo D", team1:"Senegal",      team2:"Arabia S.",    kickoff:"2026-06-20T18:00:00Z" },
  { id:"GD4", phase:"grupos", group:"Grupo D", team1:"España",       team2:"Australia",    kickoff:"2026-06-20T23:00:00Z" },
  { id:"GD5", phase:"grupos", group:"Grupo D", team1:"Senegal",      team2:"España",       kickoff:"2026-06-26T23:00:00Z" },
  { id:"GD6", phase:"grupos", group:"Grupo D", team1:"Arabia S.",    team2:"Australia",    kickoff:"2026-06-26T23:00:00Z" },

  // ── GRUPO E ──────────────────────────────────────────
  { id:"GE1", phase:"grupos", group:"Grupo E", team1:"EE.UU.",       team2:"Paraguay",     kickoff:"2026-06-12T23:00:00Z" },
  { id:"GE2", phase:"grupos", group:"Grupo E", team1:"Nigeria",      team2:"Albania",      kickoff:"2026-06-14T23:00:00Z" },
  { id:"GE3", phase:"grupos", group:"Grupo E", team1:"Albania",      team2:"Paraguay",     kickoff:"2026-06-20T21:00:00Z" },
  { id:"GE4", phase:"grupos", group:"Grupo E", team1:"EE.UU.",       team2:"Nigeria",      kickoff:"2026-06-21T00:00:00Z" },
  { id:"GE5", phase:"grupos", group:"Grupo E", team1:"Albania",      team2:"EE.UU.",       kickoff:"2026-06-27T00:00:00Z" },
  { id:"GE6", phase:"grupos", group:"Grupo E", team1:"Paraguay",     team2:"Nigeria",      kickoff:"2026-06-27T00:00:00Z" },

  // ── GRUPO F ──────────────────────────────────────────
  { id:"GF1", phase:"grupos", group:"Grupo F", team1:"Croacia",      team2:"Portugal",     kickoff:"2026-06-15T18:00:00Z" },
  { id:"GF2", phase:"grupos", group:"Grupo F", team1:"Hungría",      team2:"Nueva Zelanda",kickoff:"2026-06-15T21:00:00Z" },
  { id:"GF3", phase:"grupos", group:"Grupo F", team1:"Nueva Zelanda",team2:"Portugal",     kickoff:"2026-06-21T18:00:00Z" },
  { id:"GF4", phase:"grupos", group:"Grupo F", team1:"Croacia",      team2:"Hungría",      kickoff:"2026-06-21T23:00:00Z" },
  { id:"GF5", phase:"grupos", group:"Grupo F", team1:"Nueva Zelanda",team2:"Croacia",      kickoff:"2026-06-27T23:00:00Z" },
  { id:"GF6", phase:"grupos", group:"Grupo F", team1:"Portugal",     team2:"Hungría",      kickoff:"2026-06-27T23:00:00Z" },

  // ── GRUPO G ──────────────────────────────────────────
  { id:"GG1", phase:"grupos", group:"Grupo G", team1:"Bélgica",      team2:"Argelia",      kickoff:"2026-06-15T23:00:00Z" },
  { id:"GG2", phase:"grupos", group:"Grupo G", team1:"Japón",        team2:"Ecuador",      kickoff:"2026-06-16T00:00:00Z" },
  { id:"GG3", phase:"grupos", group:"Grupo G", team1:"Ecuador",      team2:"Argelia",      kickoff:"2026-06-22T18:00:00Z" },
  { id:"GG4", phase:"grupos", group:"Grupo G", team1:"Bélgica",      team2:"Japón",        kickoff:"2026-06-22T21:00:00Z" },
  { id:"GG5", phase:"grupos", group:"Grupo G", team1:"Ecuador",      team2:"Bélgica",      kickoff:"2026-06-28T23:00:00Z" },
  { id:"GG6", phase:"grupos", group:"Grupo G", team1:"Argelia",      team2:"Japón",        kickoff:"2026-06-28T23:00:00Z" },

  // ── GRUPO H ──────────────────────────────────────────
  { id:"GH1", phase:"grupos", group:"Grupo H", team1:"Costa de Marfil",team2:"Túnez",      kickoff:"2026-06-16T18:00:00Z" },
  { id:"GH2", phase:"grupos", group:"Grupo H", team1:"Uruguay",      team2:"Irán",         kickoff:"2026-06-16T21:00:00Z" },
  { id:"GH3", phase:"grupos", group:"Grupo H", team1:"Irán",         team2:"Túnez",        kickoff:"2026-06-22T23:00:00Z" },
  { id:"GH4", phase:"grupos", group:"Grupo H", team1:"Costa de Marfil",team2:"Uruguay",    kickoff:"2026-06-23T00:00:00Z" },
  { id:"GH5", phase:"grupos", group:"Grupo H", team1:"Irán",         team2:"Costa de Marfil",kickoff:"2026-06-29T00:00:00Z" },
  { id:"GH6", phase:"grupos", group:"Grupo H", team1:"Túnez",        team2:"Uruguay",      kickoff:"2026-06-29T00:00:00Z" },

  // ── GRUPO I ──────────────────────────────────────────
  { id:"GI1", phase:"grupos", group:"Grupo I", team1:"Colombia",     team2:"Uzbekistán",   kickoff:"2026-06-17T23:00:00Z" },
  { id:"GI2", phase:"grupos", group:"Grupo I", team1:"Suecia",       team2:"Congo DR",     kickoff:"2026-06-17T18:00:00Z" },
  { id:"GI3", phase:"grupos", group:"Grupo I", team1:"Congo DR",     team2:"Uzbekistán",   kickoff:"2026-06-23T18:00:00Z" },
  { id:"GI4", phase:"grupos", group:"Grupo I", team1:"Colombia",     team2:"Suecia",       kickoff:"2026-06-23T23:00:00Z" },
  { id:"GI5", phase:"grupos", group:"Grupo I", team1:"Congo DR",     team2:"Colombia",     kickoff:"2026-06-29T23:00:00Z" },
  { id:"GI6", phase:"grupos", group:"Grupo I", team1:"Uzbekistán",   team2:"Suecia",       kickoff:"2026-06-29T23:00:00Z" },

  // ── GRUPO J ──────────────────────────────────────────
  { id:"GJ1", phase:"grupos", group:"Grupo J", team1:"Serbia",       team2:"Países Bajos", kickoff:"2026-06-17T21:00:00Z" },
  { id:"GJ2", phase:"grupos", group:"Grupo J", team1:"Irak",         team2:"Polonia",      kickoff:"2026-06-18T00:00:00Z" },
  { id:"GJ3", phase:"grupos", group:"Grupo J", team1:"Polonia",      team2:"Países Bajos", kickoff:"2026-06-23T21:00:00Z" },
  { id:"GJ4", phase:"grupos", group:"Grupo J", team1:"Serbia",       team2:"Irak",         kickoff:"2026-06-24T00:00:00Z" },
  { id:"GJ5", phase:"grupos", group:"Grupo J", team1:"Polonia",      team2:"Serbia",       kickoff:"2026-06-30T00:00:00Z" },
  { id:"GJ6", phase:"grupos", group:"Grupo J", team1:"Países Bajos", team2:"Irak",         kickoff:"2026-06-30T00:00:00Z" },

  // ── GRUPO K ──────────────────────────────────────────
  { id:"GK1", phase:"grupos", group:"Grupo K", team1:"Venezuela",    team2:"Turquía",      kickoff:"2026-06-16T23:00:00Z" },
  { id:"GK2", phase:"grupos", group:"Grupo K", team1:"Rumanía",      team2:"Angola",       kickoff:"2026-06-17T00:00:00Z" },
  { id:"GK3", phase:"grupos", group:"Grupo K", team1:"Angola",       team2:"Turquía",      kickoff:"2026-06-23T18:00:00Z" },
  { id:"GK4", phase:"grupos", group:"Grupo K", team1:"Venezuela",    team2:"Rumanía",      kickoff:"2026-06-23T21:00:00Z" },
  { id:"GK5", phase:"grupos", group:"Grupo K", team1:"Angola",       team2:"Venezuela",    kickoff:"2026-06-29T18:00:00Z" },
  { id:"GK6", phase:"grupos", group:"Grupo K", team1:"Turquía",      team2:"Rumanía",      kickoff:"2026-06-29T18:00:00Z" },

  // ── GRUPO L ──────────────────────────────────────────
  { id:"GL1", phase:"grupos", group:"Grupo L", team1:"Argentina",    team2:"Ghana",        kickoff:"2026-06-19T18:00:00Z" },
  { id:"GL2", phase:"grupos", group:"Grupo L", team1:"Jordania",     team2:"Alemania",     kickoff:"2026-06-19T21:00:00Z" },
  { id:"GL3", phase:"grupos", group:"Grupo L", team1:"Alemania",     team2:"Ghana",        kickoff:"2026-06-25T18:00:00Z" },
  { id:"GL4", phase:"grupos", group:"Grupo L", team1:"Argentina",    team2:"Jordania",     kickoff:"2026-06-25T21:00:00Z" },
  { id:"GL5", phase:"grupos", group:"Grupo L", team1:"Alemania",     team2:"Argentina",    kickoff:"2026-07-01T23:00:00Z" },
  { id:"GL6", phase:"grupos", group:"Grupo L", team1:"Ghana",        team2:"Jordania",     kickoff:"2026-07-01T23:00:00Z" },

  // ── DIECISEISAVOS ────────────────────────────────────
  { id:"R32-1",  phase:"r32", group:"Dieciseisavos · P1",  team1:"1A", team2:"2B",        kickoff:"2026-06-28T18:00:00Z" },
  { id:"R32-2",  phase:"r32", group:"Dieciseisavos · P2",  team1:"1C", team2:"2D",        kickoff:"2026-06-28T21:00:00Z" },
  { id:"R32-3",  phase:"r32", group:"Dieciseisavos · P3",  team1:"1E", team2:"2F",        kickoff:"2026-06-29T00:00:00Z" },
  { id:"R32-4",  phase:"r32", group:"Dieciseisavos · P4",  team1:"1G", team2:"2H",        kickoff:"2026-06-30T18:00:00Z" },
  { id:"R32-5",  phase:"r32", group:"Dieciseisavos · P5",  team1:"1I", team2:"2J",        kickoff:"2026-06-30T21:00:00Z" },
  { id:"R32-6",  phase:"r32", group:"Dieciseisavos · P6",  team1:"1K", team2:"2L",        kickoff:"2026-07-01T00:00:00Z" },
  { id:"R32-7",  phase:"r32", group:"Dieciseisavos · P7",  team1:"2A", team2:"1B",        kickoff:"2026-07-01T20:00:00Z" },
  { id:"R32-8",  phase:"r32", group:"Dieciseisavos · P8",  team1:"2C", team2:"1D",        kickoff:"2026-07-02T00:00:00Z" },
  { id:"R32-9",  phase:"r32", group:"Dieciseisavos · P9",  team1:"2E", team2:"1F",        kickoff:"2026-07-02T20:00:00Z" },
  { id:"R32-10", phase:"r32", group:"Dieciseisavos · P10", team1:"2G", team2:"1H",        kickoff:"2026-07-03T00:00:00Z" },
  { id:"R32-11", phase:"r32", group:"Dieciseisavos · P11", team1:"2I", team2:"1J",        kickoff:"2026-07-03T20:00:00Z" },
  { id:"R32-12", phase:"r32", group:"Dieciseisavos · P12", team1:"2K", team2:"1L",        kickoff:"2026-07-04T00:00:00Z" },
  { id:"R32-13", phase:"r32", group:"Dieciseisavos · P13", team1:"3°(A/B/C/D)", team2:"3°(E/F/G/H)", kickoff:"2026-07-04T20:00:00Z" },
  { id:"R32-14", phase:"r32", group:"Dieciseisavos · P14", team1:"3°(I/J/K/L)", team2:"1L",          kickoff:"2026-07-05T00:00:00Z" },
  { id:"R32-15", phase:"r32", group:"Dieciseisavos · P15", team1:"W-R32-1",     team2:"W-R32-2",     kickoff:"2026-07-05T20:00:00Z" },
  { id:"R32-16", phase:"r32", group:"Dieciseisavos · P16", team1:"W-R32-3",     team2:"W-R32-4",     kickoff:"2026-07-06T00:00:00Z" },

  // ── OCTAVOS ──────────────────────────────────────────
  { id:"R16-1", phase:"r16", group:"Octavos · P1", team1:"W-R32-5",  team2:"W-R32-6",  kickoff:"2026-07-04T18:00:00Z" },
  { id:"R16-2", phase:"r16", group:"Octavos · P2", team1:"W-R32-7",  team2:"W-R32-8",  kickoff:"2026-07-05T18:00:00Z" },
  { id:"R16-3", phase:"r16", group:"Octavos · P3", team1:"W-R32-9",  team2:"W-R32-10", kickoff:"2026-07-06T18:00:00Z" },
  { id:"R16-4", phase:"r16", group:"Octavos · P4", team1:"W-R32-11", team2:"W-R32-12", kickoff:"2026-07-07T18:00:00Z" },
  { id:"R16-5", phase:"r16", group:"Octavos · P5", team1:"W-R32-13", team2:"W-R32-14", kickoff:"2026-07-07T22:00:00Z" },
  { id:"R16-6", phase:"r16", group:"Octavos · P6", team1:"W-R32-15", team2:"W-R32-16", kickoff:"2026-07-08T18:00:00Z" },
  { id:"R16-7", phase:"r16", group:"Octavos · P7", team1:"W-R16-1",  team2:"W-R16-2",  kickoff:"2026-07-08T22:00:00Z" },
  { id:"R16-8", phase:"r16", group:"Octavos · P8", team1:"W-R16-3",  team2:"W-R16-4",  kickoff:"2026-07-09T22:00:00Z" },

  // ── CUARTOS ───────────────────────────────────────────
  { id:"QF-1", phase:"cuartos", group:"Cuartos · P1", team1:"W-R16-5", team2:"W-R16-6", kickoff:"2026-07-09T18:00:00Z" },
  { id:"QF-2", phase:"cuartos", group:"Cuartos · P2", team1:"W-R16-7", team2:"W-R16-8", kickoff:"2026-07-10T18:00:00Z" },
  { id:"QF-3", phase:"cuartos", group:"Cuartos · P3", team1:"W-QF-1",  team2:"W-QF-2",  kickoff:"2026-07-10T22:00:00Z" },
  { id:"QF-4", phase:"cuartos", group:"Cuartos · P4", team1:"W-R16-1", team2:"W-R16-2", kickoff:"2026-07-11T22:00:00Z" },

  // ── SEMIFINALES ────────────────────────────────────────
  { id:"SEMI-1", phase:"semi", group:"Semifinal 1",     team1:"W-QF-3",  team2:"W-QF-4",  kickoff:"2026-07-14T22:00:00Z" },
  { id:"SEMI-2", phase:"semi", group:"Semifinal 2",     team1:"W-QF-1",  team2:"W-QF-2",  kickoff:"2026-07-15T22:00:00Z" },
  { id:"SEMI-3", phase:"semi", group:"3er Puesto",      team1:"L-SEMI-1",team2:"L-SEMI-2",kickoff:"2026-07-18T20:00:00Z" },

  // ── FINAL ─────────────────────────────────────────────
  { id:"FINAL", phase:"final", group:"⭐ GRAN FINAL ⭐", team1:"W-SEMI-1",team2:"W-SEMI-2",kickoff:"2026-07-19T19:00:00Z" },
];
