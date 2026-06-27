// ═══════════════════════════════════════════════════════
//  QUINIELA MUNDIAL 2026 — APP LOGIC
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = "https://ezktefxrtiuzymzxadeg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a3RlZnhydGl1enltenhhZGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjE0MDEsImV4cCI6MjA5NDg5NzQwMX0.yBTiMgErmULqrXS0Qf-xz4yn-X66iPRzm2ZSciPuIR0";

async function sbFetch(path, options = {}) {
  const baseHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  const { headers = {}, prefer, ...restOptions } = options;
  if (prefer) baseHeaders["Prefer"] = prefer;
  const finalHeaders = Object.assign({}, baseHeaders, headers);
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, { ...restOptions, headers: finalHeaders });
  if (!res.ok) { const e = await res.text(); throw new Error("Supabase " + res.status + ": " + e); }
  const text = await res.text();
  if (!text || text.trim() === "") return null;
  try { return JSON.parse(text); }
  catch(e) { return null; }
}

const DB = {
  getPlayers:    ()           => sbFetch("players?select=*&order=points.desc"),
  createPlayer:  (name, pin)  => sbFetch("players", { method:"POST", body: JSON.stringify({name, pin, points:0}), prefer:"return=representation" }),
  deletePlayer:  (name)       => sbFetch("players?name=eq."+encodeURIComponent(name), { method:"DELETE", prefer:"return=minimal" }),
  updatePlayer:  (oldName, name, pin) => sbFetch("players?name=eq."+encodeURIComponent(oldName), { method:"PATCH", body: JSON.stringify({name, pin}), prefer:"return=minimal" }),
  updatePoints:  (name, pts)  => sbFetch("players?name=eq."+encodeURIComponent(name), { method:"PATCH", body: JSON.stringify({points:pts}), prefer:"return=minimal" }),

  getPicksByPlayer: (name)    => sbFetch("picks?player_name=eq."+encodeURIComponent(name)+"&select=*"),
  getAllPicks:    ()           => sbFetch("picks?select=*&limit=100000"),
  upsertPick:    (player_name, match_id, outcome, goals1, goals2, penales) =>
    sbFetch("picks?on_conflict=player_name,match_id", { method:"POST", body: JSON.stringify({player_name, match_id, outcome, goals1, goals2, penales}),
      headers:{"Prefer":"resolution=merge-duplicates,return=minimal"} }),
  updatePickPlayerName: (oldName, newName) =>
    sbFetch("picks?player_name=eq."+encodeURIComponent(oldName), { method:"PATCH", body: JSON.stringify({player_name: newName}), prefer:"return=minimal" }),

  getEnabled:    ()           => sbFetch("enabled_matches?select=*"),
  enableMatch:   (match_id)   => sbFetch("enabled_matches", { method:"POST", body: JSON.stringify({match_id}), headers:{"Prefer":"resolution=merge-duplicates,return=minimal"} }),
  disableMatch:  (match_id)   => sbFetch("enabled_matches?match_id=eq."+encodeURIComponent(match_id), { method:"DELETE", prefer:"return=minimal" }),

  getResults:    ()           => sbFetch("results?select=*"),
  upsertResult:  (match_id, score1, score2, penales) =>
    sbFetch("results", { method:"POST", body: JSON.stringify({match_id, score1, score2, penales: penales ?? null, updated_at: new Date().toISOString()}),
      headers:{"Prefer":"resolution=merge-duplicates,return=minimal"} }),
  deleteResult:  (match_id)   => sbFetch("results?match_id=eq."+encodeURIComponent(match_id), { method:"DELETE", prefer:"return=minimal" }),

  getLateAccess: async () => {
    try {
      // Intentar con filtro de expiración (si la columna existe)
      return await sbFetch("late_access?select=*&expires_at=gt."+new Date().toISOString());
    } catch(e) {
      // Si la columna expires_at no existe aún, traer todos sin filtro
      try { return await sbFetch("late_access?select=*"); }
      catch(e2) { console.warn("late_access missing:", e2.message); return []; }
    }
  },
  grantLateAccess: (name) => {
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutos
    return sbFetch("late_access", { method:"POST", body: JSON.stringify({player_name: name, expires_at}), headers:{"Prefer":"resolution=merge-duplicates,return=minimal"} });
  },
  revokeLateAccess:(name) => sbFetch("late_access?player_name=eq."+encodeURIComponent(name), { method:"DELETE", prefer:"return=minimal" }),

  getSettings: async () => {
    const rows = await sbFetch("settings?select=*");
    const s = {};
    (rows||[]).forEach(r => { s[r.key] = r.value; });
    return {
      ptsWinner:  parseInt(s.pts_winner  ?? 1),
      ptsPartial: parseInt(s.pts_partial ?? 1),
      ptsExact:   parseInt(s.pts_exact   ?? 4),
      ptsPenales: parseInt(s.pts_penales ?? 1),
      wcApiKey:   s.wc_api_key || "",
    };
  },
  saveSettings: (obj) => sbFetch("settings", {
    method:"POST", body: JSON.stringify(Object.entries(obj).map(([key,value])=>({key,value:String(value)}))),
    headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},
  }),
};

let currentPlayer = null;
let currentPhase  = "grupos";
let adminPhase    = "grupos";
let settings      = { ptsWinner:1, ptsPartial:1, ptsExact:4, ptsPenales:1, wcApiKey:"" };
let playerPicks   = {};
let cachedResults = {};
let cachedEnabled = {};
let lateAccessPlayers = new Map(); // jugadores con permiso especial { name -> expires_at }

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "screen-login") {
    populateLoginDropdown();
    document.getElementById("login-pin").value = "";
  }
}

// ── Ver picks de un jugador (admin) ──────────────────────
let _picksModalData = { playerName:null, picksMap:{}, resultsMap:{}, filter:"todos" };

async function viewPlayerPicks(playerName) {
  const modal = document.getElementById("modal-picks");
  if (!modal) { alert("Falta el modal en index.html"); return; }
  document.getElementById("modal-picks-title").textContent = "👁️ PICKS DE " + playerName.toUpperCase();
  document.getElementById("modal-picks-content").innerHTML = '<div class="empty-state">Cargando...</div>';
  modal.style.display = "flex";
  try {
    const [picksRows, resultsRows] = await Promise.all([DB.getPicksByPlayer(playerName), DB.getResults()]);
    const picksMap = {};
    (picksRows||[]).forEach(r => { picksMap[r.match_id] = r; });
    const resultsMap = {};
    (resultsRows||[]).forEach(r => { resultsMap[r.match_id] = r; });
    _picksModalData = { playerName, picksMap, resultsMap, filter:"todos" };
    renderPicksModalContent();
  } catch(e) {
    document.getElementById("modal-picks-content").innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
}

function setPicksFilter(filter) {
  _picksModalData.filter = filter;
  renderPicksModalContent();
}

function renderPicksModalContent() {
  const { picksMap, resultsMap, filter } = _picksModalData;

  // Filtrar según el botón seleccionado
  let matches = ALL_MATCHES.filter(m => picksMap[m.id] || resultsMap[m.id]);
  if (filter === "habilitados") {
    // Partidos habilitados que aún NO tienen resultado
    matches = matches.filter(m => cachedEnabled[m.id] && !(resultsMap[m.id] && resultsMap[m.id].score1 !== undefined));
  } else if (filter === "jugados") {
    // Partidos que ya tienen resultado
    matches = matches.filter(m => resultsMap[m.id] && resultsMap[m.id].score1 !== undefined);
  }

  // Ordenar por horario de juego
  matches = matches.slice().sort((a,b) => new Date(a.kickoff||0) - new Date(b.kickoff||0));

  // Botones de filtro
  const filterBtns = `
    <div class="picks-filter-row">
      <button class="picks-filter-btn ${filter==='habilitados'?'active':''}" onclick="setPicksFilter('habilitados')">🔵 Habilitados</button>
      <button class="picks-filter-btn ${filter==='jugados'?'active':''}" onclick="setPicksFilter('jugados')">⚪ Jugados</button>
      <button class="picks-filter-btn ${filter==='todos'?'active':''}" onclick="setPicksFilter('todos')">📋 Todos</button>
    </div>`;

  if (!matches.length) {
    document.getElementById("modal-picks-content").innerHTML = filterBtns + '<div class="empty-state">No hay partidos en este filtro.</div>';
    return;
  }

  const rows = matches.map(m => {
    const pick = picksMap[m.id];
    const result = resultsMap[m.id];
    const f1 = FLAGS[m.team1]||"🏳", f2 = FLAGS[m.team2]||"🏳";
    const hasResult = result && result.score1 !== undefined;
    let pickText = "⚪ Sin pronóstico", pickColor = "#8899bb", pts = 0, exacto = false;
    if (pick) {
      const { g1, g2, hasPrediction } = resolveGoals(pick);
      if (hasPrediction) pickText = g1+"–"+g2;
      else if (pick.outcome === "1") pickText = "Gana "+m.team1;
      else if (pick.outcome === "2") pickText = "Gana "+m.team2;
      else if (pick.outcome === "x") pickText = "Empate";
      if (hasResult) {
        pts = calcPoints(pick, result);
        pickColor = pts > 0 ? "#00c853" : "#e53935";
        exacto = hasPrediction && g1===parseInt(result.score1) && g2===parseInt(result.score2);
      }
      else pickColor = "#ffd600";
    }
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;color:#8899bb;margin-bottom:2px;">${m.kickoff ? formatKickoff(m.kickoff) : ""} · ${m.group}</div>
        <div style="font-size:13px;font-weight:500;color:#f0f4ff;">${f1} ${m.team1} vs ${m.team2} ${f2}</div>
        ${hasResult ? `<div style="font-size:11px;color:#8899bb;">Resultado: ${result.score1}–${result.score2}${result.penales ? ` · 🥅 Penales: ganó ${result.penales==='1'?m.team1:m.team2}` : ""}</div>` : ""}
        ${(pick && isKnockout(m) && pick.outcome==='x' && pick.penales) ? `<div style="font-size:11px;color:#ffd600;">🥅 Su penal: gana ${pick.penales==='1'?m.team1:m.team2}</div>` : ""}
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:13px;font-weight:600;color:${pickColor};">${exacto?'⭐ ':''}${pickText}</div>
        ${hasResult && pick ? `<div style="font-size:12px;font-family:'Bebas Neue',sans-serif;color:${pts>0?'#ffd600':'#8899bb'};">${pts>0?'+'+pts+' pts':''}</div>` : ""}
      </div>
    </div>`;
  }).join("");

  document.getElementById("modal-picks-content").innerHTML = filterBtns + rows;
}

function closePicksModal() {
  document.getElementById("modal-picks").style.display = "none";
}

// ── Permiso especial para pronosticar tarde ───────────────
async function toggleLateAccess(playerName, currentlyGranted) {
  try {
    if (currentlyGranted) {
      await DB.revokeLateAccess(playerName);
      lateAccessPlayers.delete(playerName);
    } else {
      const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await DB.grantLateAccess(playerName);
      lateAccessPlayers.set(playerName, expires_at);
      // Auto-remover del mapa al expirar
      setTimeout(async () => {
        lateAccessPlayers.delete(playerName);
        await DB.revokeLateAccess(playerName);
        await renderAdminPlayers();
      }, 5 * 60 * 1000);
    }
    await renderAdminPlayers();
  } catch(e) { alert("Error: " + e.message); }
}
function showAdminLogin() { showScreen("screen-admin-login"); }
function setLoading(msg) { document.getElementById("loading-overlay").style.display="flex"; document.getElementById("loading-msg").textContent = msg||"Cargando..."; }
function hideLoading()   { document.getElementById("loading-overlay").style.display="none"; }

function getOutcome(s1, s2) { return s1>s2?"1":s1<s2?"2":"x"; }

// ¿Es partido de fase eliminatoria? (todo lo que no sea grupos)
function isKnockout(m) { return m && m.phase && m.phase !== "grupos"; }

// Verifica si el partido está bloqueado para un jugador específico
function isLockedForPlayer(m, hasResult, playerName) {
  if (hasResult) return true;
  if (isMatchLocked(m.kickoff)) {
    const expiry = lateAccessPlayers.get(playerName);
    const hasValidAccess = expiry && Date.now() < new Date(expiry).getTime();
    if (!hasValidAccess) return true;
  }
  return false;
}

// ── HELPER: normalizar goles (null/vacío = 0) ─────────────
function parseGoal(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = parseInt(val);
  return isNaN(n) ? null : n;
}

// Si el jugador pone solo uno de los dos goles, el otro se asume 0
function resolveGoals(pick) {
  const raw1 = parseGoal(pick.goals1);
  const raw2 = parseGoal(pick.goals2);
  // Si ambos están vacíos → sin predicción de marcador
  if (raw1 === null && raw2 === null) return { g1: null, g2: null, hasPrediction: false };
  // Si solo uno está lleno → el otro es 0
  const g1 = raw1 !== null ? raw1 : 0;
  const g2 = raw2 !== null ? raw2 : 0;
  return { g1, g2, hasPrediction: true };
}

function calcPoints(pick, result) {
  if (!pick || !result) return 0;
  const s1 = parseInt(result.score1);
  const s2 = parseInt(result.score2);
  if (isNaN(s1) || isNaN(s2)) return 0;

  const { g1, g2, hasPrediction } = resolveGoals(pick);
  const actual = getOutcome(s1, s2);
  const wonCorrect = pick.outcome === actual;

  // Punto extra de penales: si el partido se fue a penales (result.penales),
  // y el jugador acertó quién ganó la tanda (pick.penales), suma ptsPenales.
  let bonusPenales = 0;
  if (result.penales && pick && pick.penales && pick.penales === result.penales) {
    bonusPenales = settings.ptsPenales;
  }

  // Marcador exacto: ambos goles correctos = 1 + 4 = 5 pts (+ penales si aplica)
  if (hasPrediction && g1 === s1 && g2 === s2) return settings.ptsWinner + settings.ptsExact + bonusPenales;

  let pts = 0;
  if (wonCorrect) pts += settings.ptsWinner;
  if (hasPrediction) {
    if (g1 === s1) pts += settings.ptsPartial;
    if (g2 === s2) pts += settings.ptsPartial;
  }
  return pts + bonusPenales;
}

async function populateLoginDropdown() {
  const select = document.getElementById("login-name");
  select.innerHTML = '<option value="">Cargando...</option>';
  try {
    const players = await DB.getPlayers();
    select.innerHTML = '<option value="">— Selecciona tu nombre —</option>';
    if (!players || !players.length) { select.innerHTML += '<option disabled value="">No hay jugadores aún</option>'; return; }
    players.sort((a,b)=>a.name.localeCompare(b.name))
      .forEach(p => { const o=document.createElement("option"); o.value=p.name; o.textContent=p.name; select.appendChild(o); });
  } catch(e) { select.innerHTML = '<option value="">Error al cargar</option>'; }
}

async function handleLogin() {
  const name = document.getElementById("login-name").value;
  const pin  = document.getElementById("login-pin").value.trim();
  if (!name) { alert("Por favor selecciona tu nombre"); return; }
  if (!pin)  { alert("Por favor ingresa tu PIN"); return; }
  setLoading("Verificando...");
  try {
    const players = await DB.getPlayers();
    const player = players.find(p => p.name === name);
    if (!player) { alert("Usuario no encontrado."); return; }
    if (player.pin !== pin) { alert("PIN incorrecto."); return; }
    currentPlayer = name;
    document.getElementById("player-greeting").textContent = name.toUpperCase();
    document.getElementById("login-pin").value = "";
    currentPhase = "grupos";
    settings = await DB.getSettings();
    const myPicksRows = await DB.getPicksByPlayer(name);
    playerPicks = {};
    (myPicksRows||[]).forEach(r => { playerPicks[r.match_id] = { outcome:r.outcome, goals1:r.goals1, goals2:r.goals2, penales:r.penales, _saved:true }; });
    const [resultsRows, enabledRows, lateRows] = await Promise.all([DB.getResults(), DB.getEnabled(), DB.getLateAccess()]);
    cachedResults = {};
    (resultsRows||[]).forEach(r => { cachedResults[r.match_id] = {score1:r.score1, score2:r.score2, penales:r.penales}; });
    cachedEnabled = {};
    (enabledRows||[]).forEach(r => { cachedEnabled[r.match_id] = true; });
    lateAccessPlayers = new Map((lateRows||[]).map(r => [r.player_name, r.expires_at]));
    renderPhaseSelector("phase-selector", currentPhase, false);
    renderPlayerMatches(currentPhase);
    renderMisPuntos();
    showScreen("screen-player");
  } catch(e) { alert("Error de conexión: "+e.message); }
  finally { hideLoading(); }
}

async function handleAdminLogin() {
  const pass = document.getElementById("admin-pass").value;
  if (pass !== ADMIN_PASSWORD) { alert("Contraseña incorrecta"); return; }
  setLoading("Cargando panel...");
  try {
    settings = await DB.getSettings();
    document.getElementById("pts-winner").value  = settings.ptsWinner;
    document.getElementById("pts-partial").value = settings.ptsPartial;
    document.getElementById("pts-exact").value   = settings.ptsExact;
    const penInput = document.getElementById("pts-penales"); if (penInput) penInput.value = settings.ptsPenales;
    document.getElementById("wc-api-key").value  = settings.wcApiKey;
    const [resultsRows, enabledRows, lateRows] = await Promise.all([DB.getResults(), DB.getEnabled(), DB.getLateAccess()]);
    cachedResults = {};
    (resultsRows||[]).forEach(r => { cachedResults[r.match_id] = {score1:r.score1, score2:r.score2, penales:r.penales}; });
    cachedEnabled = {};
    (enabledRows||[]).forEach(r => { cachedEnabled[r.match_id] = true; });
    lateAccessPlayers = new Map((lateRows||[]).map(r => [r.player_name, r.expires_at]));
    adminPhase = "grupos";
    renderPhaseSelector("admin-phase-selector", adminPhase, true);
    renderAdminMatches(adminPhase);
    await renderAdminPlayers();
    showScreen("screen-admin");
  } catch(e) { alert("Error: "+e.message); }
  finally { hideLoading(); }
}

function switchTab(tab) {
  document.querySelectorAll("#screen-player .tab").forEach(t => t.classList.toggle("active", t.dataset.tab===tab));
  document.querySelectorAll("#screen-player .tab-content").forEach(c => c.classList.toggle("active", c.id==="tab-"+tab));
  if (tab==="mispuntos") renderMisPuntos();
  if (tab==="tabla") renderTablaGrupos();
  if (tab==="ranking") renderRankingJugadores();
}
function switchAdminTab(tab) {
  document.querySelectorAll("#screen-admin .tab").forEach(t => t.classList.toggle("active", t.dataset.tab===tab));
  document.querySelectorAll("#screen-admin .tab-content").forEach(c => c.classList.toggle("active", c.id==="atab-"+tab));
  if (tab==="jugadores") renderAdminPlayers();
  if (tab==="tabla") renderAdminTabla();
}

function renderPhaseSelector(cid, activePhase, isAdmin) {
  document.getElementById(cid).innerHTML = PHASES.map(p =>
    `<button class="phase-btn ${p.id===activePhase?'active':''}"
      onclick="${isAdmin?`switchAdminPhase('${p.id}')`:`switchPhase('${p.id}')`}">${p.label}</button>`
  ).join("");
}
function switchPhase(phase) { currentPhase=phase; renderPhaseSelector("phase-selector",phase,false); renderPlayerMatches(phase); }
function switchAdminPhase(phase) { adminPhase=phase; renderPhaseSelector("admin-phase-selector",phase,true); renderAdminMatches(phase); }

function renderPlayerMatches(phase) {
  const matches = ALL_MATCHES.filter(m => m.phase===phase && cachedEnabled[m.id]);
  const container = document.getElementById("matches-container");
  if (!matches.length) { container.innerHTML=`<div class="empty-state">⏳ El administrador aún no ha habilitado partidos en esta fase.<br><br>¡Vuelve pronto!</div>`; return; }
  const sorted = matches.slice().sort((a,b) => new Date(a.kickoff||0) - new Date(b.kickoff||0));
  container.innerHTML = `<div class="group-block">${sorted.map(m=>renderMatchCard(m, cachedResults[m.id])).join("")}</div>`;
}

function renderMatchCard(m, result) {
  const pick = playerPicks[m.id] || {};
  const f1 = FLAGS[m.team1]||"🏳", f2 = FLAGS[m.team2]||"🏳";
  const hasResult = result && result.score1 !== undefined;
  const locked = isLockedForPlayer(m, hasResult, currentPlayer);
  const pts = hasResult && pick.outcome ? calcPoints(pick, result) : null;
  const pickClass = v => {
    if (pick.outcome!==v) return "";
    if (!hasResult) return "selected";
    return pick.outcome===getOutcome(result.score1,result.score2) ? "selected correct" : "selected wrong";
  };
  const noPick = locked && !pick.outcome;
  const noPickMsg = hasResult ? "⛔ Sin pronóstico — el resultado ya fue registrado" : "⛔ Sin pronóstico — el partido ya inició";

  // Mostrar pronóstico con goles resueltos (null = 0)
  const { g1: pg1, g2: pg2, hasPrediction: hasPred } = resolveGoals(pick);
  const pronosticoDisplay = hasPred ? `${pg1}–${pg2}` : null;

  return `
    <div class="match-card ${locked?'locked':''}">
      <div class="match-date">${m.kickoff ? formatKickoff(m.kickoff) : m.date || ""} ${locked && !hasResult ? "🔒" : ""} <span class="match-group-tag">${m.group}</span></div>
      <div class="teams-row">
        <div class="team"><span class="flag">${f1}</span><span class="tname">${m.team1}</span></div>
        ${hasResult ? `<div class="scoreboard">${result.score1}<span class="vs-sep"> - </span>${result.score2}</div>` : `<div class="vs-label">VS</div>`}
        <div class="team right"><span class="tname">${m.team2}</span><span class="flag">${f2}</span></div>
      </div>
      ${noPick ? `<div class="no-pick-msg">${noPickMsg}</div>` : `
      <div class="pick-row">
        <button class="pick-btn ${pickClass('1')}" ${locked?"disabled":""} onclick="setPick('${m.id}','1')">Gana ${m.team1}</button>
        <button class="pick-btn draw ${pickClass('x')}" ${locked?"disabled":""} onclick="setPick('${m.id}','x')">Empate</button>
        <button class="pick-btn ${pickClass('2')}" ${locked?"disabled":""} onclick="setPick('${m.id}','2')">Gana ${m.team2}</button>
      </div>`}
      ${(!noPick && !locked) ? `
      <div class="score-prediction">
        <span class="score-pred-label">Pronostica el marcador — o solo elige ganador arriba:</span>
        <div class="score-pred-row">
          <span class="score-pred-team">${m.team1}</span>
          <input type="number" min="0" max="20" placeholder="0" id="g1-${m.id}" value="${pick.goals1 ?? ''}" onchange="setGoals('${m.id}')" class="score-pred-input" />
          <span class="score-pred-sep">—</span>
          <input type="number" min="0" max="20" placeholder="0" id="g2-${m.id}" value="${pick.goals2 ?? ''}" onchange="setGoals('${m.id}')" class="score-pred-input" />
          <span class="score-pred-team">${m.team2}</span>
        </div>
      </div>` : ""}
      ${(!noPick && !locked && isKnockout(m) && pick.outcome === "x") ? `
      <div class="penales-box">
        <span class="penales-label">⚽ Empate → se van a penales. ¿Quién gana la tanda?</span>
        <div class="penales-row">
          <button class="penales-btn ${pick.penales==='1'?'selected':''}" onclick="setPenales('${m.id}','1')">🥅 Gana ${m.team1}</button>
          <button class="penales-btn ${pick.penales==='2'?'selected':''}" onclick="setPenales('${m.id}','2')">🥅 Gana ${m.team2}</button>
        </div>
      </div>` : ""}
      ${hasResult && pick.outcome ? `
        <div class="pick-result-msg ${pts>0?'msg-ok':'msg-fail'}">
          ${pts>0 ? `✅ +${pts} punto${pts!==1?'s':''} — ${getResultLabel(pick,result)}` : '❌ Fallaste este partido'}
        </div>` : ""}
      ${(locked || hasResult) && pick.outcome ? `
        <div class="mi-pronostico">Tu pronóstico: ${pronosticoTexto(pick, m)}${(isKnockout(m) && pick.outcome==='x' && pick.penales) ? ` · Penales: gana ${pick.penales==='1'?m.team1:m.team2}` : ''}</div>` : ""}
    </div>`;
}

// Devuelve el texto del pronóstico del jugador (marcador o ganador)
function pronosticoTexto(pick, m) {
  const { g1, g2, hasPrediction } = resolveGoals(pick);
  if (hasPrediction) return `${g1}–${g2}`;
  if (pick.outcome === "1") return "Gana " + m.team1;
  if (pick.outcome === "2") return "Gana " + m.team2;
  if (pick.outcome === "x") return "Empate";
  return "—";
}

function getResultLabel(pick, result) {
  const { g1, g2, hasPrediction } = resolveGoals(pick);
  const s1 = parseInt(result.score1), s2 = parseInt(result.score2);
  const actual = getOutcome(s1, s2);
  const wonCorrect = pick.outcome === actual;
  const g1ok = hasPrediction && g1 === s1;
  const g2ok = hasPrediction && g2 === s2;
  const penalesOk = result.penales && pick.penales && pick.penales === result.penales;
  const penalesTxt = penalesOk ? " + 🥅 penales" : "";
  if (hasPrediction && g1ok && g2ok)    return "⭐ 🎯 ¡Marcador exacto!" + penalesTxt;
  if (wonCorrect && (g1ok || g2ok))     return "Acertaste ganador + goles marcados" + penalesTxt;
  if (!wonCorrect && (g1ok || g2ok))    return "Acertaste goles marcados" + penalesTxt;
  if (wonCorrect)                        return "Acertaste el ganador" + penalesTxt;
  if (penalesOk)                         return "Acertaste los penales 🥅";
  return "Acertaste";
}

function setPick(matchId, outcome) {
  const m = ALL_MATCHES.find(x => x.id === matchId);
  if (m && isLockedForPlayer(m, !!cachedResults[matchId], currentPlayer)) return;
  if (!playerPicks[matchId]) playerPicks[matchId] = {};
  playerPicks[matchId].outcome = outcome;
  const g1 = playerPicks[matchId].goals1;
  const g2 = playerPicks[matchId].goals2;
  const hasBothGoals = g1 !== null && g1 !== undefined && g2 !== null && g2 !== undefined;
  if (hasBothGoals) {
    const derivedFromScore = g1 > g2 ? "1" : g1 < g2 ? "2" : "x";
    if (derivedFromScore !== outcome) {
      playerPicks[matchId].goals1 = null; playerPicks[matchId].goals2 = null;
      const inp1 = document.getElementById("g1-"+matchId); const inp2 = document.getElementById("g2-"+matchId);
      if (inp1) inp1.value = ""; if (inp2) inp2.value = "";
    }
  }
  const container = document.getElementById("matches-container");
  container.querySelectorAll(".pick-btn").forEach(btn => {
    const onclick = btn.getAttribute("onclick") || "";
    if (!onclick.includes("'"+matchId+"'")) return;
    btn.classList.remove("selected","correct","wrong","auto-derived");
    if (onclick.includes("'"+outcome+"'")) btn.classList.add("selected");
  });
  // Si dejó de ser empate, limpiar el ganador de penales
  if (outcome !== "x" && playerPicks[matchId].penales) playerPicks[matchId].penales = null;
  // Re-render para mostrar/ocultar botones de penales en eliminatorias
  if (m && isKnockout(m)) renderPlayerMatches(currentPhase);
}

// Elegir quién gana la tanda de penales (solo eliminatorias, empate)
function setPenales(matchId, who) {
  const m = ALL_MATCHES.find(x => x.id === matchId);
  if (m && isLockedForPlayer(m, !!cachedResults[matchId], currentPlayer)) return;
  if (!playerPicks[matchId]) playerPicks[matchId] = {};
  playerPicks[matchId].penales = who;
  renderPlayerMatches(currentPhase);
}

function setGoals(matchId) {
  const m = ALL_MATCHES.find(x => x.id === matchId);
  if (m && isLockedForPlayer(m, !!cachedResults[matchId], currentPlayer)) return;
  const g1val = document.getElementById("g1-"+matchId)?.value;
  const g2val = document.getElementById("g2-"+matchId)?.value;
  const g1 = g1val !== "" && g1val !== undefined ? parseInt(g1val) : null;
  const g2 = g2val !== "" && g2val !== undefined ? parseInt(g2val) : null;
  if (!playerPicks[matchId]) playerPicks[matchId] = {};
  playerPicks[matchId].goals1 = g1; playerPicks[matchId].goals2 = g2;

  // Derivar outcome usando resolveGoals (asume 0 si uno está vacío)
  const { g1: rg1, g2: rg2, hasPrediction } = resolveGoals({goals1: g1, goals2: g2});
  if (hasPrediction) {
    const derivedOutcome = rg1 > rg2 ? "1" : rg1 < rg2 ? "2" : "x";
    playerPicks[matchId].outcome = derivedOutcome;
    const container = document.getElementById("matches-container");
    ["1","x","2"].forEach(v => {
      const btn = container.querySelector(`[onclick="setPick('${matchId}','${v}')"]`);
      if (btn) { btn.classList.remove("selected","correct","wrong","auto-derived"); if (v === derivedOutcome) btn.classList.add("selected","auto-derived"); }
    });
  } else {
    const container = document.getElementById("matches-container");
    const anyManual = ["1","x","2"].some(v => {
      const btn = container.querySelector(`[onclick="setPick('${matchId}','${v}')"]`);
      return btn && btn.classList.contains("selected") && !btn.classList.contains("auto-derived");
    });
    if (!anyManual) {
      playerPicks[matchId].outcome = null;
      ["1","x","2"].forEach(v => { const btn = container.querySelector(`[onclick="setPick('${matchId}','${v}')"]`); if (btn) btn.classList.remove("selected","correct","wrong","auto-derived"); });
    }
  }
  // Si dejó de ser empate, limpiar penales
  if (playerPicks[matchId].outcome !== "x" && playerPicks[matchId].penales) playerPicks[matchId].penales = null;
  // En eliminatorias, re-render para mostrar/ocultar botones de penales según empate
  if (m && isKnockout(m)) renderPlayerMatches(currentPhase);
}

async function savePlayerPicks() {
  const el = document.getElementById("save-status");
  const allMatchIds = Object.keys(playerPicks);
  if (!allMatchIds.length) { el.textContent="⚠️ No hay picks que guardar"; setTimeout(()=>{el.textContent="";},3000); return; }

  // Derivar outcome para picks con marcador parcial antes de guardar
  allMatchIds.forEach(mid => {
    const p = playerPicks[mid]; if (!p) return;
    const { g1, g2, hasPrediction } = resolveGoals(p);
    if (hasPrediction && !p.outcome) {
      playerPicks[mid].outcome = g1 > g2 ? "1" : g1 < g2 ? "2" : "x";
    }
    // Guardar los goles resueltos (null → 0 si el otro tiene valor)
    if (hasPrediction) {
      playerPicks[mid].goals1 = g1;
      playerPicks[mid].goals2 = g2;
    }
  });

  const saveable = allMatchIds.filter(mid => {
    const m = ALL_MATCHES.find(x => x.id === mid); const p = playerPicks[mid];
    const expiry = lateAccessPlayers.get(currentPlayer);
    const hasValidAccess = expiry && Date.now() < new Date(expiry).getTime();
    return m && !cachedResults[mid] && (!isMatchLocked(m.kickoff) || hasValidAccess) && p && p.outcome;
  });
  const blocked = allMatchIds.length - saveable.length;
  if (!saveable.length) { el.textContent="🔒 Todos los partidos ya iniciaron"; el.className="save-status"; setTimeout(()=>{el.textContent=""; el.className="save-status";},4000); return; }
  const isModifying = saveable.some(mid => playerPicks[mid]?._saved);
  el.textContent = "Guardando..."; el.className = "save-status";
  try {
    await Promise.all(saveable.map(mid => { const p = playerPicks[mid]; const m = ALL_MATCHES.find(x=>x.id===mid); const pen = (isKnockout(m) && p.outcome==="x") ? (p.penales||null) : null; return DB.upsertPick(currentPlayer, mid, p.outcome||null, p.goals1??null, p.goals2??null, pen); }));
    await recalcPointsForPlayer(currentPlayer);
    // Marcar todos como guardados para futuras modificaciones
    saveable.forEach(mid => { if (playerPicks[mid]) playerPicks[mid]._saved = true; });
    let msg;
    if (blocked > 0) msg = `✅ Guardados ${saveable.length} picks (${blocked} bloqueado${blocked>1?'s':''})`;
    else if (isModifying) msg = "✅ Picks modificados correctamente";
    else msg = "✅ Picks guardados correctamente";
    el.textContent = msg; el.className = "save-status ok";
  } catch(e) {
    el.textContent = "❌ Error: "+e.message;
  }
  setTimeout(()=>{el.textContent=""; el.className="save-status";},3500);
}

function renderMisPuntos() {
  const played  = ALL_MATCHES.filter(m => cachedResults[m.id] && playerPicks[m.id]?.outcome)
    .slice().sort((a,b) => new Date(a.kickoff||0) - new Date(b.kickoff||0));
  const correct = played.filter(m => calcPoints(playerPicks[m.id], cachedResults[m.id]) > 0);
  const pending = ALL_MATCHES.filter(m => !cachedResults[m.id] && playerPicks[m.id]);
  const total   = played.reduce((sum,m) => sum + calcPoints(playerPicks[m.id], cachedResults[m.id]), 0);
  const container = document.getElementById("mispuntos-container");
  container.innerHTML = `
    <div class="mispuntos-hero"><div class="mispuntos-pts-big">${total}</div><div class="mispuntos-pts-label">PUNTOS TOTALES</div></div>
    <div class="mispuntos-stats">
      <div class="stat-box"><div class="stat-num">${Object.keys(playerPicks).length}</div><div class="stat-label">Picks hechos</div></div>
      <div class="stat-box"><div class="stat-num green">${correct.length}</div><div class="stat-label">Aciertos</div></div>
      <div class="stat-box"><div class="stat-num red">${played.length-correct.length}</div><div class="stat-label">Fallados</div></div>
      <div class="stat-box"><div class="stat-num muted">${pending.length}</div><div class="stat-label">Por jugar</div></div>
    </div>
    <div class="mispuntos-note"><p>✅ Ganador: ${settings.ptsWinner}pt · Goles de un equipo: +${settings.ptsPartial}pt · Marcador exacto: ${settings.ptsExact}pts · 🥅 Penales: +${settings.ptsPenales}pt</p></div>
    ${played.length ? `
    <div class="mispuntos-historial">
      <div class="group-label" style="padding:0 0 10px;">Historial de partidos</div>
      ${played.map(m => {
        const r = cachedResults[m.id], p = playerPicks[m.id];
        const pts = calcPoints(p, r);
        const f1=FLAGS[m.team1]||"🏳", f2=FLAGS[m.team2]||"🏳";
        const { g1, g2, hasPrediction } = resolveGoals(p);
        // ¿Marcador exacto? (ambos goles correctos)
        const exacto = hasPrediction && g1===parseInt(r.score1) && g2===parseInt(r.score2);
        let pronostico = "";
        if (hasPrediction) pronostico = g1+"–"+g2;
        else if (p.outcome==="1") pronostico="Gana "+m.team1;
        else if (p.outcome==="2") pronostico="Gana "+m.team2;
        else if (p.outcome==="x") pronostico="Empate";
        return `<div class="historial-row ${pts>0?'ok':'fail'}">
          <span class="historial-icon">${exacto?'⭐':(pts>0?'✅':'❌')}</span>
          <div style="flex:1">
            <div class="historial-match">${f1} ${m.team1} ${r.score1}–${r.score2} ${m.team2} ${f2}</div>
            <div style="font-size:11px;color:${pts>0?'#8899bb':'#e57373'}">Tu pronóstico: ${pronostico}${exacto?' ⭐ ¡Exacto!':''}</div>
          </div>
          <span class="historial-pts">${pts>0?'+'+pts:'0'} pts</span>
        </div>`;
      }).join("")}
    </div>` : ""}`;
}

// ── Ranking de jugadores (visible para todos) ─────────────
async function renderRankingJugadores() {
  const container = document.getElementById("ranking-container");
  if (!container) return;
  container.innerHTML = `<div class="empty-state">Cargando...</div>`;
  try {
    const players = await DB.getPlayers();
    if (!players || !players.length) {
      container.innerHTML = `<div class="empty-state">Aún no hay jugadores.</div>`;
      return;
    }
    const medals = ["🥇","🥈","🥉"];
    const podium = players.slice(0,3);
    const rest = players.slice(3);

    let html = `<div class="ranking-title">🏆 RANKING DE JUGADORES</div>`;

    // Podio destacado
    html += `<div class="ranking-podium">`;
    podium.forEach((p,i) => {
      const isMe = p.name === currentPlayer;
      html += `
        <div class="podium-card podium-${i+1} ${isMe?'podium-me':''}">
          <div class="podium-medal">${medals[i]}</div>
          <div class="podium-name">${p.name}${isMe?' <span class="me-tag">(tú)</span>':''}</div>
          <div class="podium-pts">${p.points}</div>
          <div class="podium-pts-label">pts</div>
        </div>`;
    });
    html += `</div>`;

    // Resto de la tabla
    if (rest.length) {
      html += `<div class="ranking-list">`;
      rest.forEach((p,i) => {
        const pos = i + 4;
        const isMe = p.name === currentPlayer;
        html += `
          <div class="ranking-row ${isMe?'ranking-me':''}">
            <span class="ranking-pos">${pos}</span>
            <span class="ranking-name">${p.name}${isMe?' <span class="me-tag">(tú)</span>':''}</span>
            <span class="ranking-pts">${p.points} pts</span>
          </div>`;
      });
      html += `</div>`;
    }

    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
}

async function renderAdminTabla() {
  const container = document.getElementById("admin-tabla-container");
  container.innerHTML = `<div class="empty-state">Cargando...</div>`;
  try {
    const players = await DB.getPlayers();
    if (!players||!players.length) { container.innerHTML=`<div class="empty-state">No hay jugadores.</div>`; return; }
    const medals = ["🥇","🥈","🥉"];
    container.innerHTML = `
      <div class="tabla" style="margin:16px">
        <div class="tabla-header"><span>Pos</span><span>Jugador</span><span>Pts</span></div>
        ${players.map((p,i)=>`<div class="tabla-row"><span class="pos">${medals[i]||(i+1)}</span><span class="pname">${p.name}</span><span class="pts">${p.points}</span></div>`).join("")}
      </div>
      <p class="tabla-note" style="padding:8px 20px;text-align:center">Visible solo para el admin</p>`;
  } catch(e) { container.innerHTML=`<div class="empty-state">Error: ${e.message}</div>`; }
}

function renderAdminMatches(phase) {
  const matches = ALL_MATCHES.filter(m => m.phase===phase)
    .slice().sort((a,b) => new Date(a.kickoff||0) - new Date(b.kickoff||0));
  const container = document.getElementById("admin-matches-container");
  container.innerHTML = `<div class="group-block">${matches.map(m=>renderAdminMatchCard(m)).join("")}</div>`;
}

function renderAdminMatchCard(m) {
  const r        = cachedResults[m.id]||{};
  const f1       = FLAGS[m.team1]||"🏳", f2 = FLAGS[m.team2]||"🏳";
  const hasResult= r.score1 !== undefined;
  const locked   = isMatchLocked(m.kickoff);
  const enabled  = !!cachedEnabled[m.id];
  return `
    <div class="match-card admin-match ${enabled ? 'match-enabled' : 'match-disabled'}" id="card-${m.id}">
      <div class="match-card-top">
        <span class="match-date">${m.kickoff ? formatKickoff(m.kickoff) : ""} ${locked && !hasResult ? "🔒" : ""} <span class="match-group-tag">${m.group}</span></span>
        <div style="display:flex;gap:6px;align-items:center;">
          ${hasResult ? `<button class="btn-reset-result" onclick="resetResult('${m.id}')" title="Restablecer resultado">🔄 Resetear</button>` : ""}
          <button class="btn-toggle ${enabled ? 'enabled' : 'disabled'}" onclick="toggleMatch('${m.id}', ${enabled})">
            ${enabled ? "✅ Habilitado" : "🔴 Deshabilitado"}
          </button>
        </div>
      </div>
      <div class="admin-score-row">
        <div class="admin-team"><span class="flag">${f1}</span><span class="tname">${m.team1}</span></div>
        <div class="admin-inputs">
          <input type="number" min="0" max="30" placeholder="-" id="score-${m.id}-1" value="${r.score1??''}" />
          <span class="vs-sep">–</span>
          <input type="number" min="0" max="30" placeholder="-" id="score-${m.id}-2" value="${r.score2??''}" />
        </div>
        <div class="admin-team right"><span class="tname">${m.team2}</span><span class="flag">${f2}</span></div>
      </div>
      ${isKnockout(m) ? `
      <div class="admin-penales-row">
        <span class="admin-penales-label">Penales (si hubo empate):</span>
        <select id="penales-${m.id}" class="admin-penales-select">
          <option value="" ${!r.penales?'selected':''}>— Sin penales —</option>
          <option value="1" ${r.penales==='1'?'selected':''}>Ganó ${m.team1}</option>
          <option value="2" ${r.penales==='2'?'selected':''}>Ganó ${m.team2}</option>
        </select>
      </div>` : ""}
    </div>`;
}

async function resetResult(matchId) {
  const m = ALL_MATCHES.find(x => x.id === matchId);
  const name = m ? `${m.team1} vs ${m.team2}` : matchId;
  if (!confirm(`¿Resetear el resultado de ${name}?\n\nSe borrará el marcador y los puntos serán recalculados.`)) return;
  setLoading("Reseteando resultado...");
  try {
    await DB.deleteResult(matchId);
    delete cachedResults[matchId];
    await recalcAllPoints();
    const card = document.getElementById("card-"+matchId);
    if (card && m) card.outerHTML = renderAdminMatchCard(m);
    else renderAdminMatches(adminPhase);
    alert("✅ Resultado reseteado. Los puntos han sido recalculados.");
  } catch(e) { alert("❌ Error: "+e.message); }
  finally { hideLoading(); }
}

async function toggleMatch(matchId, currentlyEnabled) {
  try {
    if (currentlyEnabled) { await DB.disableMatch(matchId); delete cachedEnabled[matchId]; }
    else { await DB.enableMatch(matchId); cachedEnabled[matchId] = true; }
    const cards = document.querySelectorAll(`#admin-matches-container .match-card`);
    cards.forEach(card => {
      const btn = card.querySelector(`[onclick*="'${matchId}'"]`);
      if (btn && btn.classList.contains("btn-toggle")) {
        const enabled = !!cachedEnabled[matchId];
        btn.className = "btn-toggle " + (enabled ? "enabled" : "disabled");
        btn.textContent = enabled ? "✅ Habilitado" : "🔴 Deshabilitado";
        btn.setAttribute("onclick", `toggleMatch('${matchId}', ${enabled})`);
        card.classList.toggle("match-enabled", enabled);
        card.classList.toggle("match-disabled", !enabled);
      }
    });
  } catch(e) { alert("Error: "+e.message); }
}

async function toggleAllPhase(enable) {
  const matches = ALL_MATCHES.filter(m => m.phase === adminPhase);
  setLoading(enable ? "Habilitando todos..." : "Deshabilitando todos...");
  try {
    await Promise.all(matches.map(m => { if (enable) { cachedEnabled[m.id]=true; return DB.enableMatch(m.id); } else { delete cachedEnabled[m.id]; return DB.disableMatch(m.id); } }));
    renderAdminMatches(adminPhase);
  } catch(e) { alert("Error: "+e.message); }
  finally { hideLoading(); }
}

async function saveResults() {
  setLoading("Guardando resultados...");
  try {
    const matches = ALL_MATCHES.filter(m => m.phase===adminPhase);
    const toSave = [];
    matches.forEach(m => {
      const s1=document.getElementById("score-"+m.id+"-1")?.value;
      const s2=document.getElementById("score-"+m.id+"-2")?.value;
      if (s1!==""&&s2!==""&&s1!==undefined&&s2!==undefined) {
        // Penales: solo si es eliminatoria y el marcador es empate
        let pen = null;
        if (isKnockout(m) && parseInt(s1) === parseInt(s2)) {
          pen = document.getElementById("penales-"+m.id)?.value || null;
        }
        toSave.push({match_id:m.id, score1:parseInt(s1), score2:parseInt(s2), penales:pen});
        cachedResults[m.id]={score1:parseInt(s1), score2:parseInt(s2), penales:pen};
      }
    });
    await Promise.all(toSave.map(r => DB.upsertResult(r.match_id, r.score1, r.score2, r.penales)));
    await recalcAllPoints();
    alert("✅ "+toSave.length+" resultado(s) guardado(s).");
  } catch(e) { alert("❌ Error: "+e.message); }
  finally { hideLoading(); }
}

async function syncResultsFromAPI() {
  if (!settings.wcApiKey) { alert("Primero guarda tu API Key en la pestaña CONFIG."); return; }
  setLoading("Sincronizando resultados...");
  try {
    const res = await fetch("https://api.wc2026api.com/matches?status=finished", { headers: { "Authorization": "Bearer " + settings.wcApiKey } });
    if (!res.ok) throw new Error("API respondió "+res.status);
    const data = await res.json();
    const matches = Array.isArray(data) ? data : (data.matches || data.data || []);
    if (!matches.length) { alert("No hay partidos finalizados aún."); return; }
    let synced = 0;
    for (const apiMatch of matches) {
      const home = apiMatch.home_team || apiMatch.homeTeam || "";
      const away = apiMatch.away_team || apiMatch.awayTeam || "";
      const s1 = apiMatch.home_score ?? apiMatch.homeScore ?? apiMatch.score?.home;
      const s2 = apiMatch.away_score ?? apiMatch.awayScore ?? apiMatch.score?.away;
      if (s1===undefined || s2===undefined) continue;
      const found = ALL_MATCHES.find(m => normTeam(m.team1)===normTeam(home) && normTeam(m.team2)===normTeam(away));
      if (!found) continue;
      await DB.upsertResult(found.id, parseInt(s1), parseInt(s2));
      cachedResults[found.id] = { score1:parseInt(s1), score2:parseInt(s2) };
      synced++;
    }
    await recalcAllPoints();
    renderAdminMatches(adminPhase);
    alert("✅ "+synced+" partidos sincronizados.");
  } catch(e) { alert("❌ Error al sincronizar: "+e.message); }
  finally { hideLoading(); }
}

function normTeam(name) {
  return (name||"").toLowerCase()
    .replace(/[áàä]/g,"a").replace(/[éèë]/g,"e")
    .replace(/[íìï]/g,"i").replace(/[óòö]/g,"o")
    .replace(/[úùü]/g,"u").replace(/ñ/g,"n")
    .replace(/[^a-z0-9]/g,"").trim();
}

async function recalcPointsForPlayer(playerName) {
  const [resultsRows, myPicksRows] = await Promise.all([DB.getResults(), DB.getPicksByPlayer(playerName)]);
  const picksMap = {};
  myPicksRows.forEach(r => { picksMap[r.match_id] = {outcome:r.outcome, goals1:r.goals1, goals2:r.goals2, penales:r.penales}; });
  let pts = 0;
  resultsRows.forEach(r => { pts += calcPoints(picksMap[r.match_id], r); });
  await DB.updatePoints(playerName, pts);
}

async function recalcAllPoints() {
  const [players, resultsRows, allPicks] = await Promise.all([DB.getPlayers(), DB.getResults(), DB.getAllPicks()]);
  await Promise.all(players.map(player => {
    const myPicks = allPicks.filter(p => p.player_name===player.name);
    const picksMap = {};
    myPicks.forEach(r => { picksMap[r.match_id] = {outcome:r.outcome, goals1:r.goals1, goals2:r.goals2, penales:r.penales}; });
    let pts = 0;
    resultsRows.forEach(r => { pts += calcPoints(picksMap[r.match_id], r); });
    return DB.updatePoints(player.name, pts);
  }));
}

async function renderAdminPlayers() {
  const container = document.getElementById("admin-players-container");
  container.innerHTML = `<div class="empty-state">Cargando...</div>`;
  try {
    const [players, allPicks, resultsRows] = await Promise.all([DB.getPlayers(), DB.getAllPicks(), DB.getResults()]);
    if (!players||!players.length) { container.innerHTML=`<div class="empty-state">No hay jugadores todavía.<br>Crea el primero arriba 👆</div>`; return; }
    const medals = ["🥇","🥈","🥉"];
    container.innerHTML = players.map((p,i) => {
      const myPicks = allPicks.filter(pk => pk.player_name===p.name);
      const correct = myPicks.filter(pk => { const r=resultsRows.find(r=>r.match_id===pk.match_id); return r && calcPoints({outcome:pk.outcome,goals1:pk.goals1,goals2:pk.goals2,penales:pk.penales},r)>0; }).length;
      return `<div class="player-card">
        <div class="player-header">
          <span class="player-medal">${medals[i]||(i+1)}</span>
          <span class="player-name">${p.name}</span>
          <span class="player-pts">${p.points} pts</span>
          <button class="btn-view-picks" onclick="viewPlayerPicks('${p.name}')" title="Ver picks">👁️</button>
          <button class="btn-edit" onclick="openEditModal('${p.name}','${p.pin}')" title="Editar">✏️</button>
          <button class="btn-delete" onclick="deletePlayer('${p.name}')" title="Eliminar">🗑</button>
        </div>
        <div class="player-stats">
          <span>PIN: <span class="player-pin">${p.pin}</span></span>
          <span>Picks: ${myPicks.length}/${ALL_MATCHES.length}</span>
          <span>Aciertos: ${correct}</span>
        </div>
      </div>`;
    }).join("");
  } catch(e) { container.innerHTML=`<div class="empty-state">Error: ${e.message}</div>`; }
}

async function createPlayer() {
  const name = document.getElementById("new-player-name").value.trim();
  const pin  = document.getElementById("new-player-pin").value.trim();
  if (!name) { alert("Ingresa un nombre."); return; }
  if (!pin)  { alert("Ingresa un PIN."); return; }
  if (!/^\d+$/.test(pin)) { alert("El PIN debe ser solo números."); return; }
  setLoading("Creando usuario...");
  try {
    await DB.createPlayer(name, pin);
    document.getElementById("new-player-name").value = "";
    document.getElementById("new-player-pin").value = "";
    await renderAdminPlayers();
    await populateLoginDropdown();
    alert("✅ Usuario \""+name+"\" creado con PIN "+pin);
  } catch(e) {
    if (e.message.includes("23505")||e.message.includes("duplicate")) alert("El usuario \""+name+"\" ya existe.");
    else alert("Error: "+e.message);
  } finally { hideLoading(); }
}

function openEditModal(name, pin) {
  document.getElementById("edit-original-name").value = name;
  document.getElementById("edit-name").value = name;
  document.getElementById("edit-pin").value  = pin;
  document.getElementById("modal-edit").style.display = "flex";
}
function closeEditModal() { document.getElementById("modal-edit").style.display = "none"; }

async function saveEditPlayer() {
  const oldName = document.getElementById("edit-original-name").value;
  const newName = document.getElementById("edit-name").value.trim();
  const newPin  = document.getElementById("edit-pin").value.trim();
  if (!newName) { alert("El nombre no puede estar vacío."); return; }
  if (!newPin)  { alert("El PIN no puede estar vacío."); return; }
  if (!/^\d+$/.test(newPin)) { alert("El PIN debe ser solo números."); return; }
  setLoading("Actualizando jugador...");
  try {
    if (oldName !== newName) await DB.updatePickPlayerName(oldName, newName);
    await DB.updatePlayer(oldName, newName, newPin);
    closeEditModal();
    await renderAdminPlayers();
    await populateLoginDropdown();
    alert("✅ Jugador actualizado.");
  } catch(e) { alert("Error: "+e.message); }
  finally { hideLoading(); }
}

async function deletePlayer(name) {
  if (!confirm("¿Eliminar a "+name+"?")) return;
  setLoading("Eliminando...");
  try {
    await DB.deletePlayer(name);
    await renderAdminPlayers();
    await populateLoginDropdown();
  } catch(e) { alert("Error: "+e.message); }
  finally { hideLoading(); }
}

async function saveSettings() {
  const ptsWinner  = parseInt(document.getElementById("pts-winner").value)  || 1;
  const ptsPartial = parseInt(document.getElementById("pts-partial").value) || 1;
  const ptsExact   = parseInt(document.getElementById("pts-exact").value)   || 4;
  const ptsPenalesEl = document.getElementById("pts-penales");
  const ptsPenales = ptsPenalesEl ? (parseInt(ptsPenalesEl.value) || 0) : 1;
  setLoading("Guardando configuración...");
  try {
    await DB.saveSettings({ pts_winner:ptsWinner, pts_partial:ptsPartial, pts_exact:ptsExact, pts_penales:ptsPenales });
    settings = { ...settings, ptsWinner, ptsPartial, ptsExact, ptsPenales };
    await recalcAllPoints();
    alert("✅ Configuración guardada y puntos recalculados.");
  } catch(e) { alert("Error: "+e.message); }
  finally { hideLoading(); }
}

async function saveApiKey() {
  const key = document.getElementById("wc-api-key").value.trim();
  if (!key) { alert("Ingresa la API Key."); return; }
  setLoading("Guardando API Key...");
  try {
    await DB.saveSettings({ wc_api_key: key });
    settings.wcApiKey = key;
    alert("✅ API Key guardada.");
  } catch(e) { alert("Error: "+e.message); }
  finally { hideLoading(); }
}

async function resetAllData() {
  if (!confirm("⚠️ ESTO BORRARÁ TODOS LOS DATOS. ¿Estás seguro?")) return;
  if (!confirm("¿Seguro de verdad? No hay vuelta atrás.")) return;
  setLoading("Borrando datos...");
  try {
    await sbFetch("picks?id=neq.00000000-0000-0000-0000-000000000000",   { method:"DELETE", prefer:"return=minimal" });
    await sbFetch("results?match_id=neq.NONE",                           { method:"DELETE", prefer:"return=minimal" });
    await sbFetch("players?id=neq.00000000-0000-0000-0000-000000000000", { method:"DELETE", prefer:"return=minimal" });
    cachedResults={}; playerPicks={};
    alert("Datos borrados."); showScreen("screen-login");
  } catch(e) { alert("Error: "+e.message); }
  finally { hideLoading(); }
}

populateLoginDropdown();

function renderTablaGrupos() {
  const container = document.getElementById("tabla-grupos-container");
  if (!container) return;
  const groupKeys = Object.keys(GROUP_TEAMS);
  const groupMatches = ALL_MATCHES.filter(m => m.phase === "grupos");
  container.innerHTML = groupKeys.map(g => {
    const teams = GROUP_TEAMS[g];
    const stats = {};
    teams.forEach(t => { stats[t] = { pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 }; });
    groupMatches.filter(m => m.group === "Grupo "+g).forEach(m => {
      const r = cachedResults[m.id];
      if (!r || r.score1 === undefined) return;
      const s1 = parseInt(r.score1), s2 = parseInt(r.score2);
      const t1 = stats[m.team1], t2 = stats[m.team2];
      if (!t1 || !t2) return;
      t1.pj++; t2.pj++; t1.gf+=s1; t1.gc+=s2; t2.gf+=s2; t2.gc+=s1;
      if (s1>s2) { t1.pg++; t1.pts+=3; t2.pp++; }
      else if (s1<s2) { t2.pg++; t2.pts+=3; t1.pp++; }
      else { t1.pe++; t1.pts++; t2.pe++; t2.pts++; }
    });
    const sorted = teams.slice().sort((a,b) => {
      const sa=stats[a], sb=stats[b];
      if (sb.pts!==sa.pts) return sb.pts-sa.pts;
      const difA=sa.gf-sa.gc, difB=sb.gf-sb.gc;
      if (difB!==difA) return difB-difA;
      return sb.gf-sa.gf;
    });
    return `
      <div class="grupo-tabla-block">
        <div class="grupo-tabla-header">GRUPO ${g}</div>
        <div class="grupo-tabla-table">
          <div class="gt-row gt-head">
            <span class="gt-pos">#</span><span class="gt-team">País</span>
            <span class="gt-stat">PJ</span><span class="gt-stat">G</span><span class="gt-stat">E</span><span class="gt-stat">P</span>
            <span class="gt-stat">GF</span><span class="gt-stat">GC</span><span class="gt-stat gt-pts">PTS</span>
          </div>
          ${sorted.map((team,i) => {
            const s=stats[team], flag=FLAGS[team]||"🏳";
            const qualify = i<2?"qualify-direct":i===2?"qualify-third":"";
            return `<div class="gt-row ${qualify}">
              <span class="gt-pos">${i+1}</span>
              <span class="gt-team"><span class="gt-flag">${flag}</span>${team}</span>
              <span class="gt-stat">${s.pj}</span><span class="gt-stat">${s.pg}</span>
              <span class="gt-stat">${s.pe}</span><span class="gt-stat">${s.pp}</span>
              <span class="gt-stat">${s.gf}</span><span class="gt-stat">${s.gc}</span>
              <span class="gt-stat gt-pts">${s.pts}</span>
            </div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("") + `
    <div class="gt-leyenda">
      <span class="leyenda-item qualify-direct-dot">■</span> Clasificado directo &nbsp;
      <span class="leyenda-item qualify-third-dot">■</span> Posible mejor 3°
    </div>`;
}
