// ═══════════════════════════════════════════════════════
//  MUNDIAL 2026 — FIXTURE OFICIAL
//  Horarios en hora Ecuador (ECT = UTC-5)
//  Fuente: FIFA / calendario oficial (verificado jun 2026)
//  NOTA: ET en junio/julio = EDT = UTC-4 → UTC = ET + 4h
// ═══════════════════════════════════════════════════════

const ADMIN_PASSWORD = "mundial2026admin";

const PHASES = [
  { id:"grupos",  label:"Fase de Grupos"   },
  { id:"r32",     label:"Ronda de 32"      },
  { id:"r16",     label:"Octavos de Final" },
  { id:"cuartos", label:"Cuartos de Final" },
  { id:"semi",    label:"Semifinales"      },
  { id:"final",   label:"Final"            },
];

// Grupos para la tabla de posiciones
const GROUP_TEAMS = {
  A: ["México","Sudáfrica","Corea del Sur","Chequia"],
  B: ["Canadá","Bosnia-Herzegovina","Qatar","Suiza"],
  C: ["Brasil","Marruecos","Haití","Escocia"],
  D: ["EE.UU.","Paraguay","Australia","Turquía"],
  E: ["Alemania","Curazao","Costa de Marfil","Ecuador"],
  F: ["Países Bajos","Japón","Suecia","Túnez"],
  G: ["Bélgica","Egipto","Irán","Nueva Zelanda"],
  H: ["España","Cabo Verde","Arabia S.","Uruguay"],
  I: ["Francia","Senegal","Irak","Noruega"],
  J: ["Argentina","Argelia","Austria","Jordania"],
  K: ["Portugal","Congo DR","Uzbekistán","Colombia"],
  L: ["Inglaterra","Croacia","Ghana","Panamá"],
};

const FLAGS = {
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","Chequia":"🇨🇿",
  "Canadá":"🇨🇦","Bosnia-Herzegovina":"🇧🇦","Qatar":"🇶🇦","Suiza":"🇨🇭",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "EE.UU.":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia S.":"🇸🇦","Uruguay":"🇺🇾",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","Congo DR":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};

// kickoff en UTC — Ecuador = UTC-5 (se muestra con formatKickoff)
function isMatchLocked(kickoffUTC) {
  if (!kickoffUTC) return false;
  return Date.now() >= new Date(kickoffUTC).getTime();
}

function formatKickoff(kickoffUTC) {
  if (!kickoffUTC) return "";
  return new Date(kickoffUTC).toLocaleString("es-EC", {
    timeZone: "America/Guayaquil",
    weekday:"short", day:"numeric", month:"short",
    hour:"2-digit", minute:"2-digit"
  });
}

// ══════════════════════════════════════════════════════
//  FASE DE GRUPOS — horarios en UTC (ET oficial + 4h)
//  Ecuador (hora local) = UTC - 5
// ══════════════════════════════════════════════════════
const ALL_MATCHES = [

  // ── GRUPO A ──────────────────────────────────────────
  { id:"GA1", phase:"grupos", group:"Grupo A", team1:"México",        team2:"Sudáfrica",    kickoff:"2026-06-11T19:00:00Z" },
  { id:"GA2", phase:"grupos", group:"Grupo A", team1:"Corea del Sur", team2:"Chequia",      kickoff:"2026-06-12T01:00:00Z" },
  { id:"GA3", phase:"grupos", group:"Grupo A", team1:"Chequia",       team2:"Sudáfrica",    kickoff:"2026-06-18T16:00:00Z" },
  { id:"GA4", phase:"grupos", group:"Grupo A", team1:"México",        team2:"Corea del Sur",kickoff:"2026-06-19T01:00:00Z" },
  { id:"GA5", phase:"grupos", group:"Grupo A", team1:"Chequia",       team2:"México",       kickoff:"2026-06-25T01:00:00Z" },
  { id:"GA6", phase:"grupos", group:"Grupo A", team1:"Sudáfrica",     team2:"Corea del Sur",kickoff:"2026-06-25T01:00:00Z" },

  // ── GRUPO B ──────────────────────────────────────────
  { id:"GB1", phase:"grupos", group:"Grupo B", team1:"Canadá",              team2:"Bosnia-Herzegovina",kickoff:"2026-06-12T19:00:00Z" },
  { id:"GB2", phase:"grupos", group:"Grupo B", team1:"Qatar",               team2:"Suiza",             kickoff:"2026-06-13T19:00:00Z" },
  { id:"GB3", phase:"grupos", group:"Grupo B", team1:"Suiza",               team2:"Bosnia-Herzegovina",kickoff:"2026-06-18T19:00:00Z" },
  { id:"GB4", phase:"grupos", group:"Grupo B", team1:"Canadá",              team2:"Qatar",             kickoff:"2026-06-18T22:00:00Z" },
  { id:"GB5", phase:"grupos", group:"Grupo B", team1:"Bosnia-Herzegovina",  team2:"Qatar",             kickoff:"2026-06-24T19:00:00Z" },
  { id:"GB6", phase:"grupos", group:"Grupo B", team1:"Suiza",               team2:"Canadá",            kickoff:"2026-06-24T19:00:00Z" },

  // ── GRUPO C ──────────────────────────────────────────
  { id:"GC1", phase:"grupos", group:"Grupo C", team1:"Brasil",    team2:"Marruecos", kickoff:"2026-06-13T22:00:00Z" },
  { id:"GC2", phase:"grupos", group:"Grupo C", team1:"Haití",     team2:"Escocia",   kickoff:"2026-06-14T01:00:00Z" },
  { id:"GC3", phase:"grupos", group:"Grupo C", team1:"Escocia",   team2:"Marruecos", kickoff:"2026-06-19T22:00:00Z" },
  { id:"GC4", phase:"grupos", group:"Grupo C", team1:"Brasil",    team2:"Haití",     kickoff:"2026-06-20T00:30:00Z" },
  { id:"GC5", phase:"grupos", group:"Grupo C", team1:"Escocia",   team2:"Brasil",    kickoff:"2026-06-24T22:00:00Z" },
  { id:"GC6", phase:"grupos", group:"Grupo C", team1:"Marruecos", team2:"Haití",     kickoff:"2026-06-24T22:00:00Z" },

  // ── GRUPO D ──────────────────────────────────────────
  { id:"GD1", phase:"grupos", group:"Grupo D", team1:"EE.UU.",    team2:"Paraguay",  kickoff:"2026-06-13T01:00:00Z" },
  { id:"GD2", phase:"grupos", group:"Grupo D", team1:"Australia", team2:"Turquía",   kickoff:"2026-06-14T04:00:00Z" },
  { id:"GD3", phase:"grupos", group:"Grupo D", team1:"EE.UU.",    team2:"Australia", kickoff:"2026-06-19T19:00:00Z" },
  { id:"GD4", phase:"grupos", group:"Grupo D", team1:"Turquía",   team2:"Paraguay",  kickoff:"2026-06-20T03:00:00Z" },
  { id:"GD5", phase:"grupos", group:"Grupo D", team1:"Turquía",   team2:"EE.UU.",    kickoff:"2026-06-26T02:00:00Z" },
  { id:"GD6", phase:"grupos", group:"Grupo D", team1:"Paraguay",  team2:"Australia", kickoff:"2026-06-26T02:00:00Z" },

  // ── GRUPO E: Ecuador está aquí! ──────────────────────
  { id:"GE1", phase:"grupos", group:"Grupo E", team1:"Alemania",        team2:"Curazao",         kickoff:"2026-06-14T17:00:00Z" },
  { id:"GE2", phase:"grupos", group:"Grupo E", team1:"Costa de Marfil", team2:"Ecuador",         kickoff:"2026-06-14T23:00:00Z" },
  { id:"GE3", phase:"grupos", group:"Grupo E", team1:"Alemania",        team2:"Costa de Marfil", kickoff:"2026-06-20T20:00:00Z" },
  { id:"GE4", phase:"grupos", group:"Grupo E", team1:"Ecuador",         team2:"Curazao",         kickoff:"2026-06-21T00:00:00Z" },
  { id:"GE5", phase:"grupos", group:"Grupo E", team1:"Ecuador",         team2:"Alemania",        kickoff:"2026-06-25T20:00:00Z" },
  { id:"GE6", phase:"grupos", group:"Grupo E", team1:"Curazao",         team2:"Costa de Marfil", kickoff:"2026-06-25T20:00:00Z" },

  // ── GRUPO F ──────────────────────────────────────────
  { id:"GF1", phase:"grupos", group:"Grupo F", team1:"Países Bajos", team2:"Japón",  kickoff:"2026-06-14T20:00:00Z" },
  { id:"GF2", phase:"grupos", group:"Grupo F", team1:"Suecia",       team2:"Túnez",  kickoff:"2026-06-15T02:00:00Z" },
  { id:"GF3", phase:"grupos", group:"Grupo F", team1:"Países Bajos", team2:"Suecia", kickoff:"2026-06-20T17:00:00Z" },
  { id:"GF4", phase:"grupos", group:"Grupo F", team1:"Japón",        team2:"Túnez",  kickoff:"2026-06-21T04:00:00Z" },
  { id:"GF5", phase:"grupos", group:"Grupo F", team1:"Japón",         team2:"Suecia",       kickoff:"2026-06-25T23:00:00Z" },
  { id:"GF6", phase:"grupos", group:"Grupo F", team1:"Túnez",         team2:"Países Bajos", kickoff:"2026-06-25T23:00:00Z" },

  // ── GRUPO G ──────────────────────────────────────────
  { id:"GG1", phase:"grupos", group:"Grupo G", team1:"Bélgica",       team2:"Egipto",        kickoff:"2026-06-15T19:00:00Z" },
  { id:"GG2", phase:"grupos", group:"Grupo G", team1:"Irán",          team2:"Nueva Zelanda", kickoff:"2026-06-16T01:00:00Z" },
  { id:"GG3", phase:"grupos", group:"Grupo G", team1:"Bélgica",       team2:"Irán",          kickoff:"2026-06-21T19:00:00Z" },
  { id:"GG4", phase:"grupos", group:"Grupo G", team1:"Nueva Zelanda", team2:"Egipto",        kickoff:"2026-06-22T01:00:00Z" },
  { id:"GG5", phase:"grupos", group:"Grupo G", team1:"Nueva Zelanda", team2:"Bélgica",       kickoff:"2026-06-27T03:00:00Z" },
  { id:"GG6", phase:"grupos", group:"Grupo G", team1:"Egipto",        team2:"Irán",          kickoff:"2026-06-27T03:00:00Z" },

  // ── GRUPO H ──────────────────────────────────────────
  { id:"GH1", phase:"grupos", group:"Grupo H", team1:"España",    team2:"Cabo Verde", kickoff:"2026-06-15T16:00:00Z" },
  { id:"GH2", phase:"grupos", group:"Grupo H", team1:"Arabia S.", team2:"Uruguay",    kickoff:"2026-06-15T22:00:00Z" },
  { id:"GH3", phase:"grupos", group:"Grupo H", team1:"España",    team2:"Arabia S.",  kickoff:"2026-06-21T16:00:00Z" },
  { id:"GH4", phase:"grupos", group:"Grupo H", team1:"Uruguay",   team2:"Cabo Verde", kickoff:"2026-06-21T22:00:00Z" },
  { id:"GH5", phase:"grupos", group:"Grupo H", team1:"Uruguay",    team2:"España",    kickoff:"2026-06-27T00:00:00Z" },
  { id:"GH6", phase:"grupos", group:"Grupo H", team1:"Cabo Verde", team2:"Arabia S.", kickoff:"2026-06-27T00:00:00Z" },

  // ── GRUPO I ──────────────────────────────────────────
  { id:"GI1", phase:"grupos", group:"Grupo I", team1:"Francia", team2:"Senegal", kickoff:"2026-06-16T19:00:00Z" },
  { id:"GI2", phase:"grupos", group:"Grupo I", team1:"Irak",    team2:"Noruega", kickoff:"2026-06-16T22:00:00Z" },
  { id:"GI3", phase:"grupos", group:"Grupo I", team1:"Francia", team2:"Irak",    kickoff:"2026-06-22T21:00:00Z" },
  { id:"GI4", phase:"grupos", group:"Grupo I", team1:"Noruega", team2:"Senegal", kickoff:"2026-06-23T00:00:00Z" },
  { id:"GI5", phase:"grupos", group:"Grupo I", team1:"Noruega", team2:"Francia", kickoff:"2026-06-26T19:00:00Z" },
  { id:"GI6", phase:"grupos", group:"Grupo I", team1:"Senegal", team2:"Irak",    kickoff:"2026-06-26T19:00:00Z" },

  // ── GRUPO J ──────────────────────────────────────────
  { id:"GJ1", phase:"grupos", group:"Grupo J", team1:"Argentina", team2:"Argelia",  kickoff:"2026-06-17T01:00:00Z" },
  { id:"GJ2", phase:"grupos", group:"Grupo J", team1:"Austria",   team2:"Jordania", kickoff:"2026-06-17T04:00:00Z" },
  { id:"GJ3", phase:"grupos", group:"Grupo J", team1:"Argentina", team2:"Austria",  kickoff:"2026-06-22T17:00:00Z" },
  { id:"GJ4", phase:"grupos", group:"Grupo J", team1:"Jordania",  team2:"Argelia",  kickoff:"2026-06-23T03:00:00Z" },
  { id:"GJ5", phase:"grupos", group:"Grupo J", team1:"Jordania",  team2:"Argentina",kickoff:"2026-06-28T02:00:00Z" },
  { id:"GJ6", phase:"grupos", group:"Grupo J", team1:"Argelia",   team2:"Austria",  kickoff:"2026-06-28T02:00:00Z" },

  // ── GRUPO K ──────────────────────────────────────────
  { id:"GK1", phase:"grupos", group:"Grupo K", team1:"Portugal",   team2:"Congo DR",   kickoff:"2026-06-17T17:00:00Z" },
  { id:"GK2", phase:"grupos", group:"Grupo K", team1:"Uzbekistán", team2:"Colombia",   kickoff:"2026-06-18T02:00:00Z" },
  { id:"GK3", phase:"grupos", group:"Grupo K", team1:"Portugal",   team2:"Uzbekistán", kickoff:"2026-06-23T17:00:00Z" },
  { id:"GK4", phase:"grupos", group:"Grupo K", team1:"Colombia",   team2:"Congo DR",   kickoff:"2026-06-24T02:00:00Z" },
  { id:"GK5", phase:"grupos", group:"Grupo K", team1:"Colombia",   team2:"Portugal",   kickoff:"2026-06-27T23:30:00Z" },
  { id:"GK6", phase:"grupos", group:"Grupo K", team1:"Congo DR",   team2:"Uzbekistán", kickoff:"2026-06-27T23:30:00Z" },

  // ── GRUPO L ──────────────────────────────────────────
  { id:"GL1", phase:"grupos", group:"Grupo L", team1:"Inglaterra", team2:"Croacia",    kickoff:"2026-06-17T20:00:00Z" },
  { id:"GL2", phase:"grupos", group:"Grupo L", team1:"Ghana",      team2:"Panamá",     kickoff:"2026-06-17T23:00:00Z" },
  { id:"GL3", phase:"grupos", group:"Grupo L", team1:"Inglaterra", team2:"Ghana",      kickoff:"2026-06-23T20:00:00Z" },
  { id:"GL4", phase:"grupos", group:"Grupo L", team1:"Panamá",     team2:"Croacia",    kickoff:"2026-06-23T23:00:00Z" },
  { id:"GL5", phase:"grupos", group:"Grupo L", team1:"Panamá",     team2:"Inglaterra", kickoff:"2026-06-27T21:00:00Z" },
  { id:"GL6", phase:"grupos", group:"Grupo L", team1:"Croacia",    team2:"Ghana",      kickoff:"2026-06-27T21:00:00Z" },

  // ══════════════════════════════════════════════════════
  //  RONDA DE 32 (ET oficial + 4h = UTC)
  // ══════════════════════════════════════════════════════
  { id:"R32-1",  phase:"r32", group:"Ronda 32 · P73", team1:"2A", team2:"2B", kickoff:"2026-06-28T19:00:00Z" },
  { id:"R32-2",  phase:"r32", group:"Ronda 32 · P76", team1:"1C", team2:"2F", kickoff:"2026-06-29T17:00:00Z" },
  { id:"R32-3",  phase:"r32", group:"Ronda 32 · P74", team1:"1E", team2:"3(ABCDF)", kickoff:"2026-06-29T20:30:00Z" },
  { id:"R32-4",  phase:"r32", group:"Ronda 32 · P75", team1:"1F", team2:"2C", kickoff:"2026-06-30T01:00:00Z" },
  { id:"R32-5",  phase:"r32", group:"Ronda 32 · P78", team1:"2E", team2:"2I", kickoff:"2026-06-30T17:00:00Z" },
  { id:"R32-6",  phase:"r32", group:"Ronda 32 · P77", team1:"1I", team2:"3(CDFGH)", kickoff:"2026-06-30T21:00:00Z" },
  { id:"R32-7",  phase:"r32", group:"Ronda 32 · P79", team1:"1A", team2:"3(CEFHI)", kickoff:"2026-07-01T01:00:00Z" },
  { id:"R32-8",  phase:"r32", group:"Ronda 32 · P80", team1:"1L", team2:"3(EHIJK)", kickoff:"2026-07-01T16:00:00Z" },
  { id:"R32-9",  phase:"r32", group:"Ronda 32 · P82", team1:"1G", team2:"3(AEHIJ)", kickoff:"2026-07-01T20:00:00Z" },
  { id:"R32-10", phase:"r32", group:"Ronda 32 · P81", team1:"1D", team2:"3(BEFIJ)", kickoff:"2026-07-02T00:00:00Z" },
  { id:"R32-11", phase:"r32", group:"Ronda 32 · P84", team1:"1H", team2:"2J", kickoff:"2026-07-02T19:00:00Z" },
  { id:"R32-12", phase:"r32", group:"Ronda 32 · P83", team1:"2K", team2:"2L", kickoff:"2026-07-02T23:00:00Z" },
  { id:"R32-13", phase:"r32", group:"Ronda 32 · P85", team1:"1B", team2:"3(EFGIJ)", kickoff:"2026-07-03T03:00:00Z" },
  { id:"R32-14", phase:"r32", group:"Ronda 32 · P88", team1:"2D", team2:"2G", kickoff:"2026-07-03T18:00:00Z" },
  { id:"R32-15", phase:"r32", group:"Ronda 32 · P86", team1:"1J", team2:"2H", kickoff:"2026-07-03T22:00:00Z" },
  { id:"R32-16", phase:"r32", group:"Ronda 32 · P87", team1:"1K", team2:"3(DEIJL)", kickoff:"2026-07-04T01:30:00Z" },

  // ══════════════════════════════════════════════════════
  //  OCTAVOS DE FINAL (ET + 4h = UTC)
  // ══════════════════════════════════════════════════════
  { id:"R16-1", phase:"r16", group:"Octavos · P90", team1:"W-R32-1",  team2:"W-R32-4",  kickoff:"2026-07-04T17:00:00Z" },
  { id:"R16-2", phase:"r16", group:"Octavos · P89", team1:"W-R32-3",  team2:"W-R32-6",  kickoff:"2026-07-04T21:00:00Z" },
  { id:"R16-3", phase:"r16", group:"Octavos · P91", team1:"W-R32-2",  team2:"W-R32-5",  kickoff:"2026-07-05T20:00:00Z" },
  { id:"R16-4", phase:"r16", group:"Octavos · P92", team1:"W-R32-7",  team2:"W-R32-8",  kickoff:"2026-07-06T00:00:00Z" },
  { id:"R16-5", phase:"r16", group:"Octavos · P93", team1:"W-R32-12", team2:"W-R32-11", kickoff:"2026-07-06T19:00:00Z" },
  { id:"R16-6", phase:"r16", group:"Octavos · P94", team1:"W-R32-10", team2:"W-R32-9",  kickoff:"2026-07-07T00:00:00Z" },
  { id:"R16-7", phase:"r16", group:"Octavos · P95", team1:"W-R32-15", team2:"W-R32-14", kickoff:"2026-07-07T16:00:00Z" },
  { id:"R16-8", phase:"r16", group:"Octavos · P96", team1:"W-R32-13", team2:"W-R32-16", kickoff:"2026-07-07T20:00:00Z" },

  // ══════════════════════════════════════════════════════
  //  CUARTOS DE FINAL (ET + 4h = UTC)
  // ══════════════════════════════════════════════════════
  { id:"QF-1", phase:"cuartos", group:"Cuartos · P97",  team1:"W-R16-2", team2:"W-R16-1", kickoff:"2026-07-09T20:00:00Z" },
  { id:"QF-2", phase:"cuartos", group:"Cuartos · P98",  team1:"W-R16-5", team2:"W-R16-6", kickoff:"2026-07-10T19:00:00Z" },
  { id:"QF-3", phase:"cuartos", group:"Cuartos · P99",  team1:"W-R16-3", team2:"W-R16-4", kickoff:"2026-07-11T21:00:00Z" },
  { id:"QF-4", phase:"cuartos", group:"Cuartos · P100", team1:"W-R16-7", team2:"W-R16-8", kickoff:"2026-07-12T01:00:00Z" },

  // ══════════════════════════════════════════════════════
  //  SEMIFINALES (ET + 4h = UTC)
  // ══════════════════════════════════════════════════════
  { id:"SEMI-1", phase:"semi", group:"Semifinal · P101", team1:"W-QF-1",  team2:"W-QF-2",  kickoff:"2026-07-14T19:00:00Z" },
  { id:"SEMI-2", phase:"semi", group:"Semifinal · P102", team1:"W-QF-3",  team2:"W-QF-4",  kickoff:"2026-07-15T19:00:00Z" },
  { id:"SEMI-3", phase:"semi", group:"3er Puesto · P103", team1:"L-SEMI-1",team2:"L-SEMI-2", kickoff:"2026-07-18T21:00:00Z" },

  // ══════════════════════════════════════════════════════
  //  GRAN FINAL (ET + 4h = UTC)
  // ══════════════════════════════════════════════════════
  { id:"FINAL", phase:"final", group:"⭐ GRAN FINAL — MetLife Stadium ⭐", team1:"W-SEMI-1", team2:"W-SEMI-2", kickoff:"2026-07-19T19:00:00Z" },
];
