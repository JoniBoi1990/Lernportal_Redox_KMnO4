/* Virtuelles Praktikum: Redoxreaktionen mit Kaliumpermanganat
 * Schule Birklehof · Chemie Kursstufe Leistungsfach
 * Datengetriebene Umsetzung: Versuchseinheiten (Visualisierung), Tabellen (Dropdowns mit Feedback), Aufgaben (aufklappbare Lösungen).
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Hilfsfunktionen für chemische Formeln
 * Notation: Ziffern nach Buchstaben/Klammer = tiefgestellt, ^2- / ^+ = hochgestellt, -> = Reaktionspfeil
 * ------------------------------------------------------------------ */
const SUB_U = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const SUP_U = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' };

/** Formel -> HTML mit <sub>/<sup> */
function ce(s) {
  return s
    .replace(/->/g, '→')
    .replace(/\^(\d*[+-])/g, (_, g) => `<sup>${g.replace('-', '−')}</sup>`)
    .replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
}

/** Formel -> Unicode-Text (für <option>, die kein Markup erlauben) */
function ceU(s) {
  return s
    .replace(/->/g, '→')
    .replace(/\^(\d*[+-])/g, (_, g) => [...g].map((ch) => SUP_U[ch]).join(''))
    .replace(/([A-Za-z)\]])(\d+)/g, (_, a, d) => a + [...d].map((ch) => SUP_U && SUB_U[ch]).join(''));
}

/* ------------------------------------------------------------------ *
 * Farben (Visualisierung)
 * ------------------------------------------------------------------ */
const COL = {
  clear: 'rgba(205, 225, 240, 0.55)',
  mn7: '#9b3aac',
  mixBlue: '#5b4fa8',
  mn6: '#23935a',
  brown: '#93683a',
  yellowBrown: '#b07f36',
  fe2: '#dcebd0',
  fe3: '#efdf96',
  iodine: '#b5661f',
  iodineLight: '#e8bf7f',
  heptane: 'rgba(245, 245, 245, 0.75)',
  heptaneViolet: '#a145c4',
  blue: '#2457c5',
  pale: '#dcb3dc',
  dropClear: '#cfe3f2',
};

/* ------------------------------------------------------------------ *
 * Speicher (localStorage)
 * ------------------------------------------------------------------ */
const STORE_KEY = 'birklehof-redox-kmno4-v1';
const store = (() => {
  let data = { sel: {}, tries: {}, obs: {}, done: {}, notes: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) data = { ...data, ...JSON.parse(raw) };
  } catch { /* privater Modus o. Ä. – ohne Speicherung weiter */ }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* ignorieren */ }
  };
  return { data, save };
})();

/* ------------------------------------------------------------------ *
 * SVG-Bausteine
 * ------------------------------------------------------------------ */
let uid = 0;

function tubeSVG(opts = {}) {
  const id = `t${++uid}`;
  const w = opts.limewater ? 160 : 90;
  const clip = 'M25 20 V190 A20 20 0 0 0 65 190 V20 Z';
  return `
  <svg viewBox="0 0 ${w} 240" role="img" aria-hidden="true" focusable="false">
    <defs><clipPath id="${id}-clip"><path d="${clip}"/></clipPath></defs>
    <rect class="bath" x="8" y="135" width="74" height="95" rx="6" fill="rgba(120,180,230,.35)" opacity="0"/>
    <g class="odor" opacity="0" stroke="#8a8f6a" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M35 14 q-6 -8 0 -16 q6 -8 0 -16"/><path d="M48 12 q-6 -8 0 -16 q6 -8 0 -16"/><path d="M60 14 q-6 -8 0 -16 q6 -8 0 -16"/>
    </g>
    <g clip-path="url(#${id}-clip)">
      <rect x="0" y="0" width="90" height="240" fill="rgba(255,255,255,.6)"/>
      <rect class="liq" x="20" y="118" width="50" height="110" style="fill:${opts.init || COL.clear}"/>
      <rect class="top-layer" x="20" y="96" width="50" height="22" opacity="0" style="fill:${COL.heptane}"/>
      <g class="ppt" opacity="0" fill="${COL.brown}">
        <circle cx="34" cy="203" r="4"/><circle cx="44" cy="206" r="5"/><circle cx="55" cy="203" r="4"/>
        <circle cx="39" cy="197" r="3"/><circle cx="50" cy="198" r="3.5"/><circle cx="45" cy="192" r="2.5"/>
        <circle cx="30" cy="185" r="1.6"/><circle cx="58" cy="180" r="1.6"/><circle cx="42" cy="170" r="1.4"/><circle cx="52" cy="160" r="1.3"/>
      </g>
      <g class="bubbles" fill="rgba(255,255,255,.85)" stroke="rgba(80,110,140,.6)">
        <circle class="bubble" cx="36" cy="205" r="2.6"/><circle class="bubble" cx="47" cy="208" r="2.2"/>
        <circle class="bubble" cx="56" cy="204" r="2.8"/><circle class="bubble" cx="42" cy="200" r="2"/>
      </g>
    </g>
    <path d="M25 20 V190 A20 20 0 0 0 65 190 V20" fill="none" stroke="#6b7d8e" stroke-width="2.2"/>
    <path d="M21 20 H69" stroke="#6b7d8e" stroke-width="2.2" stroke-linecap="round"/>
    <circle class="drop" cx="45" cy="0" r="4.5" fill="${COL.mn7}"/>
    ${opts.glimmspan ? `
    <g class="glim" opacity="0">
      <line x1="80" y1="-22" x2="48" y2="8" stroke="#a0763f" stroke-width="4" stroke-linecap="round"/>
      <circle cx="48" cy="8" r="3.5" fill="#d9480f"/>
      <path class="spark" d="M48 10 C40 0 44 -10 48 -18 C52 -10 56 0 48 10 Z" fill="#ffb703" stroke="#fb8500" stroke-width="1"/>
    </g>` : ''}
    ${opts.limewater ? `
    <rect x="30" y="14" width="30" height="10" rx="2" fill="#8d6e63"/>
    <path d="M45 14 V4 H125 V200" fill="none" stroke="#6b7d8e" stroke-width="2.5"/>
    <g>
      <rect x="100" y="140" width="50" height="85" rx="4" fill="rgba(255,255,255,.6)" stroke="#6b7d8e" stroke-width="2"/>
      <rect class="lime" x="102" y="160" width="46" height="63" rx="3" style="fill:rgba(215,235,245,.65)"/>
      <g class="lime-bubbles" fill="rgba(255,255,255,.9)" stroke="rgba(80,110,140,.6)">
        <circle class="bubble" cx="125" cy="215" r="2.4"/><circle class="bubble" cx="122" cy="212" r="2"/>
        <circle class="bubble" cx="128" cy="210" r="2.6"/><circle class="bubble" cx="125" cy="205" r="1.8"/>
      </g>
      <text x="125" y="236" font-size="10" text-anchor="middle" fill="#5b6b7b">Kalkwasser</text>
    </g>` : ''}
  </svg>`;
}

function splitDishSVG(init) {
  const id = `d${++uid}`;
  return `
  <svg viewBox="0 0 240 180" role="img" aria-hidden="true" focusable="false">
    <defs><clipPath id="${id}-c"><circle cx="120" cy="85" r="74"/></clipPath></defs>
    <circle cx="120" cy="85" r="80" fill="#f4f7fa" stroke="#9aaab8" stroke-width="2"/>
    <g clip-path="url(#${id}-c)">
      <rect class="liq liq-l" x="40" y="0" width="80" height="180" style="fill:${init}"/>
      <rect class="liq liq-r" x="120" y="0" width="80" height="180" style="fill:${init}"/>
      <g class="ppt" opacity="0" fill="${COL.brown}">
        <circle cx="80" cy="60" r="2"/><circle cx="95" cy="110" r="2.5"/><circle cx="70" cy="95" r="1.8"/>
        <circle cx="150" cy="70" r="2"/><circle cx="165" cy="105" r="2.4"/><circle cx="140" cy="120" r="1.8"/>
      </g>
    </g>
    <line x1="120" y1="5" x2="120" y2="165" stroke="#9aaab8" stroke-width="3"/>
    <text x="80" y="176" font-size="12" text-anchor="middle" fill="#5b6b7b">1: Propan-1-ol</text>
    <text x="162" y="176" font-size="12" text-anchor="middle" fill="#5b6b7b">2: Propan-2-ol</text>
  </svg>`;
}

function bearDishSVG(init) {
  const id = `d${++uid}`;
  return `
  <svg viewBox="0 0 240 175" role="img" aria-hidden="true" focusable="false">
    <defs><clipPath id="${id}-c"><circle cx="120" cy="85" r="74"/></clipPath></defs>
    <circle cx="120" cy="85" r="80" fill="#f4f7fa" stroke="#9aaab8" stroke-width="2"/>
    <g clip-path="url(#${id}-c)">
      <rect class="liq" x="40" y="0" width="160" height="180" style="fill:${init}"/>
      <circle class="halo" cx="120" cy="82" r="60" style="fill:${COL.mixBlue}; transform: scale(0)"/>
    </g>
    <g class="bear-body" opacity="0" fill="#e5533d" fill-opacity=".9" stroke="#b33a26" stroke-width="1">
      <circle cx="109" cy="54" r="5"/><circle cx="131" cy="54" r="5"/>
      <circle cx="120" cy="64" r="12"/>
      <ellipse cx="120" cy="94" rx="16" ry="21"/>
      <ellipse cx="102" cy="88" rx="5" ry="8"/><ellipse cx="138" cy="88" rx="5" ry="8"/>
      <ellipse cx="110" cy="114" rx="6" ry="7"/><ellipse cx="130" cy="114" rx="6" ry="7"/>
    </g>
  </svg>`;
}

/* ------------------------------------------------------------------ *
 * Versuchseinheiten (Visualisierung der Beobachtungen)
 * Jede Aktion besteht aus zeitlich gestaffelten Zuständen (steps) und
 * schreibt ihre Beobachtung (result) in Tabellenzellen "Zeile:Spalte".
 * ------------------------------------------------------------------ */
const UNITS = [
  // ---------------- Teil A ----------------
  {
    id: 'A1', bench: 'bench-a', kind: 'split', title: 'Versuch A1', sub: 'KMnO₄ + KOH, links Propan-1-ol, rechts Propan-2-ol',
    init: { liqL: COL.mn7, liqR: COL.mn7 },
    actions: [{
      key: 'main', label: 'Alkohole zutropfen',
      steps: [
        { wait: 0, text: 'Propan-1-ol (Hälfte 1) und Propan-2-ol (Hälfte 2) werden zugetropft und vorsichtig untergemischt …' },
        { wait: 1400, liqL: COL.mixBlue, liqR: COL.mixBlue, text: 'Die violette Farbe geht in beiden Hälften über blauviolett …' },
        { wait: 1800, liqL: COL.mn6, liqR: COL.mn6, text: '… in smaragdgrün über …' },
        { wait: 2600, liqL: COL.yellowBrown, liqR: COL.yellowBrown, ppt: 1, text: '… und schließlich in gelbbraun bis braun mit feiner Trübung (Braunstein).' },
      ],
      result: {
        'obs:a11': 'violett → (blauviolett) → smaragdgrün → gelbbraun/braun, Trübung',
        'obs:a12': 'violett → (blauviolett) → smaragdgrün → gelbbraun/braun, Trübung',
      },
    }],
  },
  {
    id: 'A2', bench: 'bench-a', kind: 'bear', title: 'Versuch A2', sub: 'KMnO₄ + NaOH + Gummibärchen',
    init: { liq: COL.mn7, bear: 0 },
    actions: [{
      key: 'main', label: 'Gummibärchen hineinlegen',
      steps: [
        { wait: 0, bear: 1, text: 'Das Gummibärchen wird in die Mitte der Petrischale gelegt …' },
        { wait: 1600, halo: COL.mixBlue, haloScale: 0.45, text: 'Um das Gummibärchen bildet sich ein blauvioletter Saum …' },
        { wait: 1800, halo: COL.mn6, haloScale: 0.8, text: '… der Saum wird smaragdgrün und breitet sich aus …' },
        { wait: 1800, liq: COL.mn6, haloScale: 1.4, text: '… bis die gesamte Lösung grün ist.' },
        { wait: 2400, liq: COL.yellowBrown, halo: COL.yellowBrown, text: 'Schließlich färbt sich die Lösung gelbbraun (fein verteilter Braunstein).' },
      ],
      result: { 'obs:a2': 'violett → blauvioletter, dann grüner Saum um das Gummibärchen → ganze Lösung smaragdgrün → gelbbraun' },
    }],
  },

  // ---------------- Teil B ----------------
  {
    id: 'B1', bench: 'bench-b', kind: 'tube', title: 'RG 1', sub: 'dest. Wasser (Referenz)', init: { liq: COL.clear },
    actions: [{
      key: 'main', label: 'Durchführen',
      steps: [
        { wait: 0, drop: COL.mn7, text: '2 Tropfen KMnO₄-Lösung werden zugegeben …' },
        { wait: 800, liq: COL.pale, text: 'Die Lösung färbt sich violett.' },
        { wait: 1200, liq: '#c27fcc', text: 'Die Lösung bleibt violett – keine weitere Veränderung.' },
      ],
      result: { 'obs:b1': 'Lösung färbt sich violett und bleibt violett (keine Reaktion).' },
    }],
  },
  {
    id: 'B2', bench: 'bench-b', kind: 'tube', title: 'RG 2', sub: 'Na₂SO₃ + NaOH (stark alkalisch)', init: { liq: COL.clear },
    actions: [{
      key: 'main', label: 'Durchführen',
      steps: [
        { wait: 0, drop: COL.mn7, text: '2 Tropfen KMnO₄-Lösung werden zugegeben – sofort hinsehen!' },
        { wait: 700, liq: COL.pale, text: 'Kurz violette Schlieren …' },
        { wait: 700, liq: COL.mn6, text: 'Die Lösung schlägt sofort nach smaragdgrün um.' },
      ],
      result: { 'obs:b2': 'Violette Tropfen schlagen sofort nach smaragdgrün um (bei längerem Stehen allmählich Braunfärbung).' },
    }],
  },
  {
    id: 'B3', bench: 'bench-b', kind: 'tube', title: 'RG 3', sub: 'Na₂SO₃ (neutral)', init: { liq: COL.clear },
    actions: [
      {
        key: 'main', label: 'Durchführen',
        steps: [
          { wait: 0, drop: COL.mn7, text: '4 Tropfen KMnO₄-Lösung werden zugegeben …' },
          { wait: 700, liq: COL.pale, text: 'Violette Färbung …' },
          { wait: 1500, liq: '#b39a78', ppt: 1, text: 'Die violette Farbe verschwindet, es bildet sich ein brauner, flockiger Niederschlag.' },
        ],
        result: { 'obs:b3': 'Violette Farbe verschwindet; brauner, flockiger Niederschlag.' },
      },
      {
        key: 'follow', label: 'Thymolphthalein zugeben', requires: 'main',
        steps: [
          { wait: 0, drop: COL.dropClear, text: '2 Tropfen Thymolphthaleinlösung werden zugegeben …' },
          { wait: 900, liq: COL.blue, text: 'Die Lösung über dem Niederschlag färbt sich intensiv blau!' },
        ],
        result: { 'thymol:b3': 'Intensive Blaufärbung der Lösung (Niederschlag bleibt braun).' },
      },
    ],
  },
  {
    id: 'B4', bench: 'bench-b', kind: 'tube', title: 'RG 4', sub: 'Na₂SO₃ + H₂SO₄ (sauer)', init: { liq: COL.clear },
    actions: [{
      key: 'main', label: 'Durchführen',
      steps: [
        { wait: 0, drop: COL.mn7, text: '4 Tropfen KMnO₄-Lösung werden zugegeben …' },
        { wait: 600, liq: COL.pale, text: 'Violette Schlieren …' },
        { wait: 700, liq: COL.clear, text: 'Die Lösung wird schlagartig vollständig farblos und bleibt klar.' },
      ],
      result: { 'obs:b4': 'Sofortige, vollständige Entfärbung; Lösung bleibt klar.' },
    }],
  },

  // ---------------- Teil C ----------------
  {
    id: 'C1', bench: 'bench-c', kind: 'tube', title: 'RG 1', sub: 'FeSO₄ + H₂SO₄', init: { liq: COL.fe2 },
    actions: [{
      key: 'main', label: 'Durchführen',
      steps: [
        { wait: 0, drop: COL.mn7, text: '4 Tropfen KMnO₄-Lösung werden zugegeben …' },
        { wait: 600, liq: COL.pale, text: 'Violette Schlieren …' },
        { wait: 800, liq: COL.fe3, text: 'Die violetten Tropfen werden sofort entfärbt; die Lösung erscheint schwach gelblich.' },
      ],
      result: { 'obs:c1': 'Sofortige Entfärbung des Permanganats; Lösung wird schwach gelblich.' },
    }],
  },
  {
    id: 'C2', bench: 'bench-c', kind: 'tube', title: 'RG 2', sub: 'KI + H₂SO₄', init: { liq: COL.clear },
    actions: [
      {
        key: 'main', label: 'Durchführen',
        steps: [
          { wait: 0, drop: COL.mn7, text: '4 Tropfen KMnO₄-Lösung werden zugegeben …' },
          { wait: 600, liq: COL.pale, text: 'Violette Schlieren …' },
          { wait: 900, liq: COL.iodine, text: 'Die Lösung färbt sich gelbbraun bis braun.' },
        ],
        result: { 'obs:c2': 'Violette Farbe verschwindet; Lösung wird gelbbraun bis braun.' },
      },
      {
        key: 'follow', label: 'Heptan zugeben & schütteln', requires: 'main',
        steps: [
          { wait: 0, top: COL.heptane, text: '10 Tropfen Heptan bilden eine farblose obere Phase. Das RG wird verschlossen und geschüttelt …' },
          { wait: 1500, top: COL.heptaneViolet, liq: COL.iodineLight, text: 'Die obere Heptan-Phase ist jetzt violett, die wässrige Phase hat sich aufgehellt.' },
        ],
        result: { 'nachweis:c2': 'Obere Heptan-Phase färbt sich violett.' },
      },
    ],
  },
  {
    id: 'C3', bench: 'bench-c', kind: 'tube', title: 'RG 3', sub: 'H₂O₂ + H₂SO₄', opts: { glimmspan: true }, init: { liq: COL.clear },
    actions: [
      {
        key: 'main', label: 'Durchführen',
        steps: [
          { wait: 0, drop: COL.mn7, text: '4 Tropfen KMnO₄-Lösung werden zugegeben …' },
          { wait: 600, liq: COL.pale, text: 'Violette Schlieren …' },
          { wait: 700, liq: COL.clear, bubbles: true, text: 'Sofortige Entfärbung unter lebhafter Gasentwicklung.' },
        ],
        result: { 'obs:c3': 'Sofortige Entfärbung, lebhafte Gasentwicklung (Bläschen).' },
      },
      {
        key: 'follow', label: 'Glimmspanprobe', requires: 'main',
        steps: [
          { wait: 0, glim: 'glow', text: 'Ein glimmender Holzspan wird in die Reagenzglasöffnung gehalten …' },
          { wait: 1300, glim: 'flame', text: 'Der Glimmspan glüht hell auf und entflammt.' },
        ],
        result: { 'nachweis:c3': 'Glimmender Holzspan glüht hell auf / entflammt.' },
      },
    ],
  },
  {
    id: 'C4', bench: 'bench-c', kind: 'tube', title: 'RG 4', sub: 'Propan-1-ol + H₂SO₄', init: { liq: COL.clear },
    actions: [
      {
        key: 'main', label: 'Durchführen',
        steps: [
          { wait: 0, drop: COL.mn7, text: '4 Tropfen KMnO₄-Lösung werden zugegeben …' },
          { wait: 700, liq: '#c27fcc', text: 'Die Lösung ist violett …' },
          { wait: 2600, liq: COL.pale, text: 'Die Violettfärbung lässt nur langsam nach …' },
          { wait: 2600, liq: COL.clear, text: 'Nach einiger Zeit ist die Lösung farblos.' },
        ],
        result: { 'obs:c4': 'Langsame Entfärbung bei Raumtemperatur (deutlich langsamer als RG 1–3).' },
      },
      {
        key: 'follow', label: 'Erwärmen & Geruchsprobe', requires: 'main',
        steps: [
          { wait: 0, bath: true, text: 'Das RG wird im heißen Wasserbad leicht erwärmt …' },
          { wait: 1600, odor: true, text: 'Vorsichtiges Zufächeln: stechender, leicht fruchtiger Geruch nach Propanal.' },
        ],
        result: { 'nachweis:c4': 'Stechender, leicht fruchtiger Geruch (nach Propanal).' },
      },
    ],
  },
  {
    id: 'C5', bench: 'bench-c', kind: 'tube', title: 'RG 5', sub: 'Methansäure + H₂SO₄', opts: { limewater: true }, init: { liq: COL.clear },
    actions: [
      {
        key: 'main', label: 'Durchführen',
        steps: [
          { wait: 0, drop: COL.mn7, text: '4 Tropfen KMnO₄-Lösung werden zugegeben …' },
          { wait: 700, liq: '#c27fcc', text: 'Die Lösung färbt sich violett.' },
          { wait: 2200, text: 'Bei Raumtemperatur verändert sich die Farbe kaum.' },
        ],
        result: { 'obs:c5': 'Lösung bleibt bei Raumtemperatur zunächst violett (sehr langsame Reaktion).' },
      },
      {
        key: 'follow', label: 'Erwärmen & Gas einleiten', requires: 'main',
        steps: [
          { wait: 0, bath: true, text: 'Das RG wird verschlossen und im heißen Wasserbad erwärmt; das Gas wird in Kalkwasser geleitet …' },
          { wait: 1800, liq: COL.clear, bubbles: true, limeBubbles: true, text: 'Die Lösung entfärbt sich, Gasblasen perlen durch das Kalkwasser …' },
          { wait: 2000, lime: 'milky', text: 'Das Kalkwasser trübt sich milchig-weiß.' },
        ],
        result: { 'nachweis:c5': 'Beim Erwärmen Entfärbung und Gasentwicklung; Kalkwasser trübt sich milchig-weiß.' },
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Tabellen (Dropdowns mit Sofort-Feedback)
 * ------------------------------------------------------------------ */
const OPT = {
  mn: [
    ['mno4', 'MnO4^- (Permanganat-Ion, unverändert)'],
    ['mno42', 'MnO4^2- (Manganat(VI)-Ion)'],
    ['mno2', 'MnO2 (Mangandioxid, Braunstein)'],
    ['mn2', 'Mn^2+ (Mangan(II)-Ion)'],
  ],
  oxMn: [['vii', '+VII'], ['vi', '+VI'], ['v', '+V'], ['iv', '+IV'], ['iii', '+III'], ['ii', '+II']],
  oxGen: [['p4', '+IV'], ['p3', '+III'], ['p2', '+II'], ['p1', '+I'], ['z', '0'], ['m1', '−I'], ['m2', '−II']],
  oxS: [['p6', '+VI'], ['p4', '+IV'], ['p2', '+II'], ['z', '0'], ['m2', '−II']],
  sProd: [
    ['so4', 'SO4^2- (Sulfat-Ion)'],
    ['so2', 'SO2 (Schwefeldioxid)'],
    ['s', 'S (Schwefel)'],
    ['s2o3', 'S2O3^2- (Thiosulfat-Ion)'],
    ['h2s', 'H2S (Schwefelwasserstoff)'],
  ],
  thymol: [
    ['alk', 'Die Lösung ist alkalisch geworden – es sind OH^--Ionen entstanden.'],
    ['acid', 'Die Lösung ist sauer geworden – es sind H3O^+-Ionen entstanden.'],
    ['none', 'Der pH-Wert ist unverändert – der Indikator reagiert mit dem Braunstein.'],
  ],
  seq: [
    ['s1', 'MnO4^- → MnO4^2- → MnO2 (+VII → +VI → +IV)'],
    ['s2', 'MnO4^- → Mn^2+ (+VII → +II)'],
    ['s3', 'MnO4^- → MnO2 → MnO4^2- (+VII → +IV → +VI)'],
    ['s4', 'MnO2 → MnO4^2- → MnO4^- (+IV → +VI → +VII)'],
  ],
  org: [
    ['propanal', 'Propanal (Aldehyd; weiter zu Propanoat)'],
    ['propanon', 'Propanon (Aceton, Keton)'],
    ['propen', 'Propen (Alken)'],
    ['gluconat', 'Gluconat (Anion der Gluconsäure)'],
    ['fructose', 'Fructose'],
    ['co2', 'CO2 und H2O (vollständige Oxidation)'],
  ],
  role: [
    ['red', 'Reduktionsmittel (Elektronendonator) – wird oxidiert'],
    ['ox', 'Oxidationsmittel (Elektronenakzeptor) – wird reduziert'],
    ['kat', 'Katalysator – wird nicht verändert'],
  ],
  partner: [
    ['fe3', 'Fe^3+ (Eisen(III)-Ion)'],
    ['fe', 'Fe (Eisen)'],
    ['i2', 'I2 (Iod)'],
    ['io3', 'IO3^- (Iodat-Ion)'],
    ['o2', 'O2 (Sauerstoff)'],
    ['h2o', 'H2O (Wasser)'],
    ['propanal', 'CH3-CH2-CHO (Propanal)'],
    ['propen', 'C3H6 (Propen)'],
    ['co2', 'CO2 (Kohlenstoffdioxid)'],
    ['co', 'CO (Kohlenstoffmonoxid)'],
  ],
};

// Zell-Konstruktoren
const g = (text) => ({ type: 'given', text });
const o = () => ({ type: 'obs' });
const s = (correct, explain, hint) => ({ type: 'select', correct, explain, hint });

const H_MN_OX = 'Sauerstoff hat in diesen Teilchen die Oxidationszahl −II. Die Summe aller Oxidationszahlen ergibt die Ladung des Teilchens.';

const TABLES = [
  {
    id: 'a', mount: 'table-a', caption: 'Teil A: Halbmikro-Versuche (alkalisches Milieu)',
    cols: [['a11', 'A1 · Hälfte 1 (Propan-1-ol)'], ['a12', 'A1 · Hälfte 2 (Propan-2-ol)'], ['a2', 'A2 (Gummibärchen / Glucose)']],
    rows: [
      { key: 'ansatz', label: 'Ansatz', cells: { a11: g('KMnO4-Lsg. + KOH + Propan-1-ol'), a12: g('KMnO4-Lsg. + KOH + Propan-2-ol'), a2: g('KMnO4-Lsg. + NaOH-Lsg. + Gummibärchen') } },
      { key: 'milieu', label: 'Milieu', cells: { a11: g('stark alkalisch'), a12: g('stark alkalisch'), a2: g('stark alkalisch') } },
      { key: 'obs', label: 'Beobachtung', cells: { a11: o(), a12: o(), a2: o() } },
      {
        key: 'seq', label: 'Zuordnung der Farbfolge zu Manganteilchen', options: 'seq',
        cells: Object.fromEntries(['a11', 'a12', 'a2'].map((c) => [c, s('s1',
          `Im stark Alkalischen nimmt ${ce('MnO4^-')} zunächst nur <strong>ein</strong> Elektron auf und wird zu grünem ${ce('MnO4^2-')} reduziert. Mit fortschreitender Reaktion entsteht brauner Braunstein ${ce('MnO2')}. Die kurzzeitig blauviolette Farbe ist eine Mischfarbe aus violett und grün.`,
          'Vergleiche die beobachtete Farbreihenfolge (violett → grün → braun) mit der Farbtabelle im Abschnitt „Start“.')])),
      },
      {
        key: 'prod', label: 'Oxidationsprodukt des organischen Stoffs', options: 'org',
        cells: {
          a11: s('propanal', `Primäre Alkohole werden zum Aldehyd oxidiert: Propan-1-ol → Propanal (C1: −I → +I). Im alkalischen Überschuss wird Propanal weiter zum Carboxylat Propanoat oxidiert (C1: +I → +III).`, 'Propan-1-ol ist ein <strong>primärer</strong> Alkohol. Welche Stoffklasse entsteht bei seiner milden Oxidation?'),
          a12: s('propanon', `Sekundäre Alkohole werden zum Keton oxidiert: Propan-2-ol → Propanon (Aceton), C2: 0 → +II. Eine Weiteroxidation ist ohne Spaltung des Kohlenstoffgerüsts nicht möglich.`, 'Propan-2-ol ist ein <strong>sekundärer</strong> Alkohol. Welche Stoffklasse entsteht bei seiner Oxidation?'),
          a2: s('gluconat', `Die Aldehydgruppe der (offenkettigen) Glucose wird zur Carboxylgruppe oxidiert; im Alkalischen liegt das Anion Gluconat vor (C1: +I → +III).`, 'Glucose besitzt in der offenkettigen Form eine Aldehydgruppe. Was entsteht bei der Oxidation einer Aldehydgruppe?'),
        },
      },
      {
        key: 'role', label: 'Rolle des organischen Stoffs', options: 'role',
        cells: Object.fromEntries(['a11', 'a12', 'a2'].map((c) => [c, s('red',
          `Der organische Stoff gibt Elektronen ab (Elektronendonator) und reduziert dabei das Permanganat. Er ist das <strong>Reduktionsmittel</strong> und wird selbst oxidiert – ${ce('MnO4^-')} ist der Elektronenakzeptor (Oxidationsmittel).`,
          'Die Oxidationszahl des Mangans sinkt. Wer muss demnach die Elektronen abgeben?')])),
      },
    ],
  },
  {
    id: 'b', mount: 'table-b', caption: 'Teil B: Reduktion von KMnO4 mit Sulfit bei unterschiedlichen pH-Werten',
    cols: [['b1', 'RG 1 (Referenz)'], ['b2', 'RG 2'], ['b3', 'RG 3'], ['b4', 'RG 4']],
    rows: [
      { key: 'vorlage', label: 'Vorlage (2 mL)', cells: { b1: g('dest. H2O'), b2: g('Na2SO3-Lsg.'), b3: g('Na2SO3-Lsg.'), b4: g('Na2SO3-Lsg.') } },
      { key: 'zusatz', label: 'Zusatz (6 Tropfen)', cells: { b1: g('—'), b2: g('NaOH-Lsg.'), b3: g('—'), b4: g('H2SO4-Lsg.') } },
      { key: 'milieu', label: 'Milieu', cells: { b1: g('neutral'), b2: g('stark alkalisch'), b3: g('neutral'), b4: g('sauer') } },
      { key: 'kmno4', label: 'Zugabe KMnO4-Lsg.', cells: { b1: g('2 Tropfen'), b2: g('2 Tropfen'), b3: g('4 Tropfen'), b4: g('4 Tropfen') } },
      { key: 'obs', label: 'Beobachtung', cells: { b1: o(), b2: o(), b3: o(), b4: o() } },
      {
        key: 'mn', label: 'Gebildete Manganverbindung', options: 'mn',
        cells: {
          b1: s('mno4', 'Ohne Reduktionsmittel findet keine Redoxreaktion statt – das violette Permanganat bleibt unverändert.', 'In RG 1 ist kein Reduktionsmittel vorhanden. Hat sich die Farbe verändert?'),
          b2: s('mno42', `Im stark Alkalischen wird ${ce('MnO4^-')} nur um ein Elektron zum smaragdgrünen Manganat(VI)-Ion reduziert: ${ce('MnO4^- + e^- -> MnO4^2-')}.`, 'Die Lösung ist smaragdgrün. Welches Manganteilchen hat diese Farbe?'),
          b3: s('mno2', `Im neutralen Milieu entsteht schwerlöslicher brauner Braunstein: ${ce('MnO4^- + 2 H2O + 3 e^- -> MnO2 + 4 OH^-')}.`, 'Es bildet sich ein brauner, flockiger Niederschlag.'),
          b4: s('mn2', `Im Sauren wird ${ce('MnO4^-')} mit 5 Elektronen bis zum nahezu farblosen ${ce('Mn^2+')} reduziert: ${ce('MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O')}.`, 'Die Lösung wird farblos. Welches Manganteilchen ist in verdünnter saurer Lösung nahezu farblos?'),
        },
      },
      {
        key: 'ox', label: 'Oxidationszahl des Mangans', options: 'oxMn',
        cells: {
          b1: s('vii', `${ce('MnO4^-')}: x + 4·(−2) = −1 ⇒ x = +7 (+VII).`, H_MN_OX),
          b2: s('vi', `${ce('MnO4^2-')}: x + 4·(−2) = −2 ⇒ x = +6 (+VI).`, H_MN_OX),
          b3: s('iv', `${ce('MnO2')}: x + 2·(−2) = 0 ⇒ x = +4 (+IV).`, H_MN_OX),
          b4: s('ii', `${ce('Mn^2+')}: Die Oxidationszahl eines einatomigen Ions entspricht seiner Ladung ⇒ +II.`, 'Bei einatomigen Ionen entspricht die Oxidationszahl der Ionenladung.'),
        },
      },
      { key: 'thymol', label: 'Zugabe von 2 Tropfen Thymolphthalein', cells: { b1: g('—'), b2: g('—'), b3: o(), b4: g('—') } },
      {
        key: 'thymolDeut', label: 'Deutung des Indikatorumschlags', options: 'thymol',
        cells: {
          b1: g('—'), b2: g('—'), b4: g('—'),
          b3: s('alk', `Bei der Reduktion zu Braunstein entstehen aus Wasser Hydroxid-Ionen: ${ce('2 MnO4^- + 3 SO3^2- + H2O -> 2 MnO2 + 3 SO4^2- + 2 OH^-')}. Der pH-Wert steigt über 9,3 – Thymolphthalein wird blau.`, 'Thymolphthalein schlägt im Bereich pH 9,3–10,5 von farblos nach blau um. Welche Teilchen müssen also entstanden sein?'),
        },
      },
      {
        key: 'sprod', label: 'Oxidationsprodukt aus Sulfit', options: 'sProd',
        cells: {
          b1: g('— (kein Sulfit)'),
          ...Object.fromEntries(['b2', 'b3', 'b4'].map((c) => [c, s('so4',
            `Sulfit ist das Reduktionsmittel: ${ce('SO3^2-')} wird zu ${ce('SO4^2-')} oxidiert und gibt dabei 2 Elektronen ab – in jedem Milieu.`,
            'Sulfit ist hier das Reduktionsmittel – die Oxidationszahl des Schwefels (+IV) muss also <strong>steigen</strong>.')])),
        },
      },
      {
        key: 'sox', label: 'Oxidationszahl des Schwefels im Produkt', options: 'oxS',
        cells: {
          b1: g('—'),
          ...Object.fromEntries(['b2', 'b3', 'b4'].map((c) => [c, s('p6',
            `${ce('SO4^2-')}: x + 4·(−2) = −2 ⇒ x = +6. Der Schwefel wird von +IV (Sulfit) zu +VI (Sulfat) oxidiert.`,
            H_MN_OX)])),
        },
      },
    ],
  },
  {
    id: 'c', mount: 'table-c', caption: 'Teil C: Redoxreaktionen von KMnO4 im sauren Milieu',
    cols: [['c1', 'RG 1'], ['c2', 'RG 2'], ['c3', 'RG 3'], ['c4', 'RG 4'], ['c5', 'RG 5']],
    rows: [
      { key: 'vorlage', label: 'Vorgelegte Lösung (2 mL)', cells: { c1: g('FeSO4-Lsg.'), c2: g('KI-Lsg.'), c3: g('H2O2-Lsg.'), c4: g('Propan-1-ol'), c5: g('Methansäure') } },
      { key: 'saeure', label: 'Ansäuern', cells: Object.fromEntries(['c1', 'c2', 'c3', 'c4', 'c5'].map((c) => [c, g('6 Tropfen H2SO4')])) },
      { key: 'obs', label: 'Beobachtung bei Zugabe von KMnO4', cells: { c1: o(), c2: o(), c3: o(), c4: o(), c5: o() } },
      { key: 'nachweis', label: 'Spezifischer Nachweis', cells: { c1: g('—'), c2: o(), c3: o(), c4: o(), c5: o() } },
      {
        key: 'mn', label: 'Gebildete Manganverbindung', options: 'mn',
        cells: {
          c1: s('mn2', `Im sauren Milieu entsteht das nahezu farblose ${ce('Mn^2+')}. Die schwach gelbe Farbe stammt von den gebildeten ${ce('Fe^3+')}-Ionen.`, 'Die Lösung ist angesäuert. Welches Manganteilchen entsteht im Sauren?'),
          c2: s('mn2', `Auch hier entsteht ${ce('Mn^2+')}. Die gelbbraune Farbe stammt <strong>nicht</strong> vom Mangan, sondern vom gebildeten Iod (bzw. ${ce('I3^-')}).`, 'Vorsicht: Die braune Farbe stammt nicht von Braunstein – es fällt kein Niederschlag aus. Die Lösung ist sauer.'),
          c3: s('mn2', `Im Sauren wird ${ce('MnO4^-')} vollständig zum nahezu farblosen ${ce('Mn^2+')} reduziert.`, 'Die Lösung wird farblos und ist sauer.'),
          c4: s('mn2', `Die Entfärbung zeigt die Bildung von ${ce('Mn^2+')} an – die Reaktion mit Propan-1-ol ist lediglich langsamer.`, 'Die Lösung wird (langsam) farblos und ist sauer.'),
          c5: s('mn2', `Nach dem Erwärmen ist die Lösung farblos: Es ist ${ce('Mn^2+')} entstanden.`, 'Betrachte die Lösung nach dem Erwärmen.'),
        },
      },
      {
        key: 'mnox', label: 'Oxidationszahl des Mangans', options: 'oxMn',
        cells: Object.fromEntries(['c1', 'c2', 'c3', 'c4', 'c5'].map((c) => [c, s('ii',
          `${ce('Mn^2+')} hat die Oxidationszahl +II. Mangan nimmt also 5 Elektronen auf (+VII → +II).`,
          'Bei einatomigen Ionen entspricht die Oxidationszahl der Ionenladung.')])),
      },
      {
        key: 'partner', label: 'Oxidationsprodukt des Reaktionspartners', options: 'partner',
        cells: {
          c1: s('fe3', `${ce('Fe^2+ -> Fe^3+ + e^-')}: Eisen(II) wird zu Eisen(III) oxidiert (schwach gelbe Lösung).`, 'Eisen(II)-Ionen sind das Reduktionsmittel. Ihre Oxidationszahl muss steigen.'),
          c2: s('i2', `${ce('2 I^- -> I2 + 2 e^-')}: Iodid wird zu Iod oxidiert. Iod löst sich gut in unpolarem Heptan und färbt es violett.`, 'Die violette Farbe der Heptan-Phase ist charakteristisch für einen Stoff, der sich in unpolaren Lösemitteln gut löst.'),
          c3: s('o2', `${ce('H2O2 + 2 H2O -> O2 + 2 H3O^+ + 2 e^-')}: Wasserstoffperoxid wirkt hier als Reduktionsmittel; das Gas ist Sauerstoff (positive Glimmspanprobe).`, 'Welches Gas lässt einen glimmenden Holzspan aufflammen?'),
          c4: s('propanal', `${ce('CH3-CH2-CH2-OH + 2 H2O -> CH3-CH2-CHO + 2 H3O^+ + 2 e^-')}: Propan-1-ol (primärer Alkohol) wird zum Aldehyd Propanal oxidiert (stechender, leicht fruchtiger Geruch).`, 'Propan-1-ol ist ein primärer Alkohol. Was entsteht bei seiner milden Oxidation?'),
          c5: s('co2', `${ce('HCOOH + 2 H2O -> CO2 + 2 H3O^+ + 2 e^-')}: Methansäure wird zu Kohlenstoffdioxid oxidiert (Kalkwasser trübt sich durch ${ce('CaCO3')}).`, 'Welches Gas trübt Kalkwasser?'),
        },
      },
      {
        key: 'partnerox', label: 'Ox.-Zahl des oxidierten Atoms im Produkt', options: 'oxGen',
        cells: {
          c1: s('p3', 'Fe: +II → +III.', 'Die Oxidationszahl eines einatomigen Ions entspricht seiner Ladung.'),
          c2: s('z', 'I: −I → 0 (Elementmolekül).', 'Atome in Elementmolekülen haben die Oxidationszahl 0.'),
          c3: s('z', `O: −I (im Peroxid ${ce('H2O2')}) → 0 (im Elementmolekül ${ce('O2')}).`, 'Atome in Elementmolekülen haben die Oxidationszahl 0.'),
          c4: s('p1', `C1: −I (in der Hydroxygruppe des Propan-1-ols) → +I (in der Aldehydgruppe des Propanals).`, 'Betrachte das Kohlenstoffatom der funktionellen Gruppe: Sauerstoff erhält die Bindungselektronen (−II), Wasserstoff gibt sie ab (+I).'),
          c5: s('p4', `C: +II (in ${ce('HCOOH')}) → +IV (in ${ce('CO2')}).`, `In ${ce('CO2')} ist jedes O-Atom −II, das Molekül ist neutral.`),
        },
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Aufgaben zur Auswertung (aufklappbare Lösungen)
 * ------------------------------------------------------------------ */
const eq = (rows) => `<div class="eq">${rows.map(([l, f, total]) =>
  `<span class="lbl">${l}</span><span class="${total ? 'total' : ''}">${ce(f)}</span>`).join('')}</div>`;

const sub = (title, html) => `<details class="sub-solution"><summary>${title}</summary>${html}</details>`;

const TASKS = [
  {
    id: 't1', title: '1. Oxidationszahlen ermitteln',
    body: '<p>Ermitteln Sie für alle an den Reaktionen beteiligten Teilchen (Teil A, B und C) die Oxidationszahlen der beteiligten Atome vor und nach der Reaktion.</p>',
    solution: `
      <p>Regeln: Elemente 0 · einatomige Ionen = Ladung · Sauerstoff meist −II (in Peroxiden −I) · Wasserstoff meist +I · Summe = Teilchenladung. Bei organischen Molekülen wird das C-Atom der funktionellen Gruppe betrachtet.</p>
      <div class="table-wrapper" tabindex="0" role="region" aria-label="Lösung Oxidationszahlen">
      <table class="data-table">
        <thead><tr><th scope="col">Atom</th><th scope="col">Edukt</th><th scope="col">Produkt</th><th scope="col">Vorgang</th></tr></thead>
        <tbody>
          <tr><th scope="row">Mn</th><td data-label="Edukt">${ce('MnO4^-')}: +VII</td><td data-label="Produkt">${ce('MnO4^2-')}: +VI · ${ce('MnO2')}: +IV · ${ce('Mn^2+')}: +II</td><td data-label="Vorgang">Reduktion</td></tr>
          <tr><th scope="row">S</th><td data-label="Edukt">${ce('SO3^2-')}: +IV</td><td data-label="Produkt">${ce('SO4^2-')}: +VI</td><td data-label="Vorgang">Oxidation</td></tr>
          <tr><th scope="row">Fe</th><td data-label="Edukt">${ce('Fe^2+')}: +II</td><td data-label="Produkt">${ce('Fe^3+')}: +III</td><td data-label="Vorgang">Oxidation</td></tr>
          <tr><th scope="row">I</th><td data-label="Edukt">${ce('I^-')}: −I</td><td data-label="Produkt">${ce('I2')}: 0</td><td data-label="Vorgang">Oxidation</td></tr>
          <tr><th scope="row">O</th><td data-label="Edukt">${ce('H2O2')}: −I</td><td data-label="Produkt">${ce('O2')}: 0</td><td data-label="Vorgang">Oxidation</td></tr>
          <tr><th scope="row">C (Propan-1-ol, C1)</th><td data-label="Edukt">−I</td><td data-label="Produkt">Propanal: +I (im Sauren; im Alkalischen weiter zu Propanoat: +III)</td><td data-label="Vorgang">Oxidation</td></tr>
          <tr><th scope="row">C (Propan-2-ol, C2)</th><td data-label="Edukt">0</td><td data-label="Produkt">Propanon: +II</td><td data-label="Vorgang">Oxidation</td></tr>
          <tr><th scope="row">C (Glucose, C1)</th><td data-label="Edukt">+I (Aldehydgruppe)</td><td data-label="Produkt">Gluconat: +III (Carboxylatgruppe)</td><td data-label="Vorgang">Oxidation</td></tr>
          <tr><th scope="row">C (Methansäure)</th><td data-label="Edukt">+II</td><td data-label="Produkt">${ce('CO2')}: +IV</td><td data-label="Vorgang">Oxidation</td></tr>
        </tbody>
      </table></div>
      <p>Die Oxidationszahlen von H (+I) und O (−II, außer im Peroxid) ändern sich bei keiner der Reaktionen.</p>`,
  },
  {
    id: 't2', title: '2. Teilgleichungen und Redoxreaktionen formulieren',
    body: `<p>Formulieren Sie jeweils die Teilgleichung für die Oxidation, die Teilgleichung für die Reduktion sowie die Gesamtgleichung mit vollständigem Ladungs- und Stoffausgleich:</p>
      <ol class="sub">
        <li>a) ${ce('MnO4^-')} mit Sulfit, stark alkalisch (Teil B, RG 2)</li>
        <li>b) ${ce('MnO4^-')} mit Sulfit, neutral (Teil B, RG 3)</li>
        <li>c) ${ce('MnO4^-')} mit Sulfit, sauer (Teil B, RG 4)</li>
        <li>d) Glucose zu Gluconat, alkalisch (Gummibärchen)</li>
        <li>e) Propan-1-ol und Propan-2-ol, alkalisch (Teil A)</li>
        <li>f) ${ce('MnO4^-')} mit ${ce('Fe^2+')}, sauer (Teil C, RG 1)</li>
        <li>g) ${ce('MnO4^-')} mit ${ce('I^-')}, sauer (Teil C, RG 2)</li>
        <li>h) ${ce('MnO4^-')} mit ${ce('H2O2')}, sauer (Teil C, RG 3)</li>
        <li>i) ${ce('MnO4^-')} mit Methansäure, sauer (Teil C, RG 5)</li>
      </ol>`,
    solution: `
      <p><strong>Vorgehen:</strong> (1) Oxidationszahlen bestimmen, (2) Elektronenzahl festlegen, (3) Ladungsausgleich im Sauren mit ${ce('H3O^+')}, im Neutralen/Alkalischen mit ${ce('OH^-')}, (4) Stoffausgleich mit ${ce('H2O')}, (5) Elektronenzahlen durch Multiplizieren angleichen und addieren.</p>
      ${sub('a) Sulfit, stark alkalisch (RG 2)', eq([
        ['Ox.:', 'SO3^2- + 2 OH^- -> SO4^2- + H2O + 2 e^-'],
        ['Red.:', 'MnO4^- + e^- -> MnO4^2-   | ·2'],
        ['Redox:', '2 MnO4^- + SO3^2- + 2 OH^- -> 2 MnO4^2- + SO4^2- + H2O', true],
      ]))}
      ${sub('b) Sulfit, neutral (RG 3)', eq([
        ['Ox.:', 'SO3^2- + 2 OH^- -> SO4^2- + H2O + 2 e^-   | ·3'],
        ['Red.:', 'MnO4^- + 2 H2O + 3 e^- -> MnO2 + 4 OH^-   | ·2'],
        ['Redox:', '2 MnO4^- + 3 SO3^2- + H2O -> 2 MnO2 + 3 SO4^2- + 2 OH^-', true],
      ]) + '<p>Netto entstehen 2 OH<sup>−</sup> – das erklärt den Umschlag von Thymolphthalein (Aufgabe 3).</p>')}
      ${sub('c) Sulfit, sauer (RG 4)', eq([
        ['Ox.:', 'SO3^2- + 3 H2O -> SO4^2- + 2 H3O^+ + 2 e^-   | ·5'],
        ['Red.:', 'MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O   | ·2'],
        ['Redox:', '2 MnO4^- + 5 SO3^2- + 6 H3O^+ -> 2 Mn^2+ + 5 SO4^2- + 9 H2O', true],
      ]))}
      ${sub('d) Glucose → Gluconat, alkalisch', eq([
        ['Ox.:', 'C6H12O6 + 3 OH^- -> C6H11O7^- + 2 H2O + 2 e^-'],
        ['Red.:', 'MnO4^- + e^- -> MnO4^2-   | ·2'],
        ['Redox:', 'C6H12O6 + 2 MnO4^- + 3 OH^- -> C6H11O7^- + 2 MnO4^2- + 2 H2O', true],
      ]) + `<p>Im weiteren Verlauf wird das grüne Manganat(VI) zu braunem Braunstein reduziert: ${ce('MnO4^2- + 2 H2O + 2 e^- -> MnO2 + 4 OH^-')}.</p>`)}
      ${sub('e) Propan-1-ol und Propan-2-ol, alkalisch', `
        <p><strong>Propan-1-ol</strong> (primärer Alkohol → Aldehyd):</p>
        ${eq([
          ['Ox.:', 'CH3-CH2-CH2-OH + 2 OH^- -> CH3-CH2-CHO + 2 H2O + 2 e^-'],
          ['Red.:', 'MnO4^- + e^- -> MnO4^2-   | ·2'],
          ['Redox:', 'CH3-CH2-CH2-OH + 2 MnO4^- + 2 OH^- -> CH3-CH2-CHO + 2 MnO4^2- + 2 H2O', true],
        ])}
        <p>Weiteroxidation zum Carboxylat: ${ce('CH3-CH2-CHO + 3 OH^- -> CH3-CH2-COO^- + 2 H2O + 2 e^-')}</p>
        <p><strong>Propan-2-ol</strong> (sekundärer Alkohol → Keton):</p>
        ${eq([
          ['Ox.:', 'CH3-CH(OH)-CH3 + 2 OH^- -> CH3-CO-CH3 + 2 H2O + 2 e^-'],
          ['Red.:', 'MnO4^- + e^- -> MnO4^2-   | ·2'],
          ['Redox:', 'CH3-CH(OH)-CH3 + 2 MnO4^- + 2 OH^- -> CH3-CO-CH3 + 2 MnO4^2- + 2 H2O', true],
        ])}`)}
      ${sub('f) Eisen(II), sauer (RG 1)', eq([
        ['Ox.:', 'Fe^2+ -> Fe^3+ + e^-   | ·5'],
        ['Red.:', 'MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O'],
        ['Redox:', 'MnO4^- + 5 Fe^2+ + 8 H3O^+ -> Mn^2+ + 5 Fe^3+ + 12 H2O', true],
      ]))}
      ${sub('g) Iodid, sauer (RG 2)', eq([
        ['Ox.:', '2 I^- -> I2 + 2 e^-   | ·5'],
        ['Red.:', 'MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O   | ·2'],
        ['Redox:', '2 MnO4^- + 10 I^- + 16 H3O^+ -> 2 Mn^2+ + 5 I2 + 24 H2O', true],
      ]))}
      ${sub('h) Wasserstoffperoxid, sauer (RG 3)', eq([
        ['Ox.:', 'H2O2 + 2 H2O -> O2 + 2 H3O^+ + 2 e^-   | ·5'],
        ['Red.:', 'MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O   | ·2'],
        ['Redox:', '2 MnO4^- + 5 H2O2 + 6 H3O^+ -> 2 Mn^2+ + 5 O2 + 14 H2O', true],
      ]) + '<p>Wasserstoffperoxid wirkt hier ausnahmsweise als <strong>Reduktionsmittel</strong>, da Permanganat das stärkere Oxidationsmittel ist.</p>')}
      ${sub('i) Methansäure, sauer (RG 5)', eq([
        ['Ox.:', 'HCOOH + 2 H2O -> CO2 + 2 H3O^+ + 2 e^-   | ·5'],
        ['Red.:', 'MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O   | ·2'],
        ['Redox:', '2 MnO4^- + 5 HCOOH + 6 H3O^+ -> 2 Mn^2+ + 5 CO2 + 14 H2O', true],
      ]))}
      ${sub('Zusatz: Propan-1-ol, sauer (RG 4)', eq([
        ['Ox.:', 'CH3-CH2-CH2-OH + 2 H2O -> CH3-CH2-CHO + 2 H3O^+ + 2 e^-   | ·5'],
        ['Red.:', 'MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O   | ·2'],
        ['Redox:', '2 MnO4^- + 5 CH3-CH2-CH2-OH + 6 H3O^+ -> 2 Mn^2+ + 5 CH3-CH2-CHO + 14 H2O', true],
      ]))}`,
  },
  {
    id: 't3', title: '3. Didaktische Vertiefung – der Indikator Thymolphthalein',
    body: '<p>In RG 3 (Teil B) wurde von einer neutralen Natriumsulfitlösung ausgegangen. Nach Zugabe von Permanganat und Entstehen von Braunstein schlägt zugegebenes Thymolphthalein (Umschlagsbereich pH 9,3–10,5, farblos → blau) intensiv nach blau um. <strong>Erklären</strong> Sie diese Beobachtung anhand Ihrer Gleichung aus Aufgabe 2b. Welches Teilchen ist für den Farbumschlag verantwortlich?</p>',
    solution: `
      <p>Gesamtgleichung im neutralen Milieu:</p>
      ${eq([['Redox:', '2 MnO4^- + 3 SO3^2- + H2O -> 2 MnO2 + 3 SO4^2- + 2 OH^-', true]])}
      <ul>
        <li>Bei der Reduktion des Permanganats zu Braunstein werden die Sauerstoffatome des ${ce('MnO4^-')} zum Teil mit Wasser zu <strong>Hydroxid-Ionen</strong> umgesetzt; die Oxidation des Sulfits verbraucht weniger OH<sup>−</sup>, als die Reduktion bildet.</li>
        <li>Netto entstehen pro Formelumsatz 2 OH<sup>−</sup>-Ionen. Da die Ausgangslösung nicht gepuffert ist, steigt der pH-Wert in den alkalischen Bereich (pH &gt; 9,3).</li>
        <li>Thymolphthalein schlägt in diesem Bereich von farblos nach blau um. Verantwortlich sind also die <strong>Hydroxid-Ionen (OH<sup>−</sup>)</strong>.</li>
      </ul>
      <p><strong>Fazit:</strong> Redoxreaktionen können das Milieu selbst verändern. Deshalb muss beim Aufstellen von Redoxgleichungen der Ladungsausgleich zum tatsächlichen Milieu passen.</p>`,
  },
  {
    id: 't4', title: '4. Einfluss des Milieus auf das Redoxpotenzial (Elektrochemie)',
    hint: 'Hinweis: Diese Aufgabe kann erst nach Studium der Elektrochemischen Spannungsreihe und der Nernst-Gleichung bearbeitet werden. Ansonsten: weglassen.',
    body: `<p><strong>Begründen</strong> Sie mithilfe der Nernst-Gleichung, weshalb Kaliumpermanganat im sauren Milieu ein deutlich stärkeres Oxidationsmittel ist als im neutralen oder alkalischen Milieu (<i>E</i>°(${ce('MnO4^-')}/${ce('Mn^2+')}) = +1,51 V; <i>E</i>°(${ce('MnO4^-')}/${ce('MnO2')}) = +0,59 V).</p>`,
    solution: `
      <p>Für die Reduktion ${ce('MnO4^- + 8 H3O^+ + 5 e^- -> Mn^2+ + 12 H2O')} lautet die Nernst-Gleichung (25 °C):</p>
      <p class="formula"><i>E</i> = <i>E</i>° + <span class="frac"><span>0,059 V</span><span>5</span></span> · lg <span class="frac"><span><i>c</i>(${ce('MnO4^-')}) · <i>c</i><sup>8</sup>(${ce('H3O^+')})</span><span><i>c</i>(${ce('Mn^2+')})</span></span></p>
      <p>Wegen lg <i>c</i><sup>8</sup>(${ce('H3O^+')}) = −8 · pH folgt:</p>
      <p class="formula"><i>E</i> = 1,51 V − <span class="frac"><span>8 · 0,059 V</span><span>5</span></span> · pH + <span class="frac"><span>0,059 V</span><span>5</span></span> · lg <span class="frac"><span><i>c</i>(${ce('MnO4^-')})</span><span><i>c</i>(${ce('Mn^2+')})</span></span> ≈ 1,51 V − 0,094 V · pH (bei gleichen Konzentrationen)</p>
      <ul>
        <li>Wegen der <strong>8 Oxonium-Ionen</strong> in der Teilgleichung sinkt das Potenzial um rund 94 mV pro pH-Einheit.</li>
        <li>pH = 0: <i>E</i> ≈ +1,51 V – sehr starkes Oxidationsmittel (oxidiert z. B. ${ce('Fe^2+')}, ${ce('I^-')}, ${ce('H2O2')}, Alkohole, Methansäure).</li>
        <li>pH = 7: <i>E</i> ≈ 1,51 V − 0,66 V ≈ +0,85 V – deutlich schwächer. Zudem ist ${ce('Mn^2+')} hier nicht mehr das Endprodukt; es bildet sich schwerlösliches ${ce('MnO2')} (<i>E</i>° = +0,59 V für das Paar ${ce('MnO4^-')}/${ce('MnO2')} im Alkalischen).</li>
        <li>Stark alkalisch: Es wird nur noch ein Elektron übertragen (${ce('MnO4^-')}/${ce('MnO4^2-')}, <i>E</i>° = +0,56 V).</li>
      </ul>
      <p><strong>Fazit:</strong> Je höher die Oxonium-Ionen-Konzentration, desto größer ist das Redoxpotenzial des Permanganats und desto mehr Elektronen nimmt es auf (5 im Sauren, 3 im Neutralen, 1 im stark Alkalischen). Kaliumpermanganat ist daher im sauren Milieu das stärkste Oxidationsmittel.</p>`,
  },
  {
    id: 't5', title: '5. Stöchiometrische Berechnungen (Laborpraxis)',
    body: `<p>a) <strong>Berechnen</strong> Sie die Masse an Kaliumpermanganat, die zur Herstellung von 250 mL einer Maßlösung mit <i>c</i> = 0,020 mol/L eingewogen werden muss (<i>M</i>(${ce('KMnO4')}) = 158,04 g/mol).</p>
      <p>b) <strong>Berechnen</strong> Sie die Masse an wasserfreiem Natriumsulfit, die zur Herstellung von 100 mL einer Lösung mit <i>c</i> = 1,0 mol/L erforderlich ist (<i>M</i>(${ce('Na2SO3')}) = 126,04 g/mol).</p>`,
    solution: `
      ${sub('a) Kaliumpermanganat', `
        <p>Gegeben: <i>V</i> = 250 mL = 0,250 L; <i>c</i> = 0,020 mol/L; <i>M</i> = 158,04 g/mol</p>
        <p>1. <i>n</i>(${ce('KMnO4')}) = <i>c</i> · <i>V</i> = 0,020 mol/L · 0,250 L = 0,0050 mol</p>
        <p>2. <i>m</i>(${ce('KMnO4')}) = <i>n</i> · <i>M</i> = 0,0050 mol · 158,04 g/mol = <strong>0,79 g</strong> (790 mg)</p>`)}
      ${sub('b) Natriumsulfit', `
        <p>Gegeben: <i>V</i> = 100 mL = 0,100 L; <i>c</i> = 1,0 mol/L; <i>M</i> = 126,04 g/mol</p>
        <p>1. <i>n</i>(${ce('Na2SO3')}) = <i>c</i> · <i>V</i> = 1,0 mol/L · 0,100 L = 0,10 mol</p>
        <p>2. <i>m</i>(${ce('Na2SO3')}) = <i>n</i> · <i>M</i> = 0,10 mol · 126,04 g/mol = <strong>12,6 g</strong></p>`)}
      <p class="muted">Kontrolle der molaren Massen: <i>M</i>(${ce('KMnO4')}) = 39,10 + 54,94 + 4 · 16,00 = 158,04 g/mol; <i>M</i>(${ce('Na2SO3')}) = 2 · 22,99 + 32,06 + 3 · 16,00 = 126,04 g/mol.</p>`,
  },
];

/* ------------------------------------------------------------------ *
 * Rendering: Versuchseinheiten
 * ------------------------------------------------------------------ */
const unitState = new Map(); // id -> { el, svg, busy }

function renderUnits() {
  for (const u of UNITS) {
    const bench = document.getElementById(u.bench);
    if (u.kind !== 'tube') bench.classList.add('bench-wide');
    const el = document.createElement('article');
    el.className = `unit ${u.kind === 'tube' ? '' : 'unit-dish'}`;
    el.innerHTML = `
      <h3>${u.title}</h3>
      <p class="unit-sub">${u.sub}</p>
      ${u.kind === 'tube' ? tubeSVG({ ...(u.opts || {}), init: u.init.liq })
        : u.kind === 'split' ? splitDishSVG(u.init.liqL) : bearDishSVG(u.init.liq)}
      <div class="controls">
        ${u.actions.map((a) => `<button type="button" class="btn ${a.key === 'main' ? '' : 'btn-secondary'}" data-action="${a.key}">${a.label}</button>`).join('')}
        <button type="button" class="btn btn-ghost" data-action="reset">Neu ansetzen</button>
      </div>
      <p class="status" aria-live="polite">Bereit.</p>`;
    bench.append(el);
    const st = { el, svg: el.querySelector('svg'), status: el.querySelector('.status'), busy: false };
    unitState.set(u.id, st);
    applyState(u, st, u.init);

    el.querySelector('.controls').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const key = btn.dataset.action;
      if (key === 'reset') resetUnit(u, st);
      else runAction(u, st, u.actions.find((a) => a.key === key));
    });
  }
}

function applyState(u, st, state) {
  const q = (sel) => st.svg.querySelector(sel);
  const setFill = (el, c) => { if (el) el.style.fill = c; };
  if (state.liq) setFill(q('.liq'), state.liq);
  if (state.liqL) setFill(q('.liq-l'), state.liqL);
  if (state.liqR) setFill(q('.liq-r'), state.liqR);
  if ('ppt' in state && q('.ppt')) q('.ppt').setAttribute('opacity', state.ppt);
  if ('top' in state && q('.top-layer')) {
    q('.top-layer').setAttribute('opacity', state.top ? 1 : 0);
    if (state.top) setFill(q('.top-layer'), state.top);
  }
  if ('bubbles' in state) q('.bubbles')?.classList.toggle('bubbling', !!state.bubbles);
  if ('limeBubbles' in state) q('.lime-bubbles')?.classList.toggle('bubbling', !!state.limeBubbles);
  if ('lime' in state) setFill(q('.lime'), state.lime === 'milky' ? 'rgba(250,250,250,.97)' : 'rgba(215,235,245,.65)');
  if ('bath' in state) q('.bath')?.setAttribute('opacity', state.bath ? 1 : 0);
  if ('odor' in state) q('.odor')?.setAttribute('opacity', state.odor ? 1 : 0);
  if ('glim' in state && q('.glim')) {
    q('.glim').setAttribute('opacity', state.glim === 'off' ? 0 : 1);
    q('.glim').classList.toggle('glowing', state.glim === 'flame');
  }
  if ('bear' in state) q('.bear-body')?.setAttribute('opacity', state.bear);
  if (state.halo) setFill(q('.halo'), state.halo);
  if ('haloScale' in state && q('.halo')) q('.halo').style.transform = `scale(${state.haloScale})`;
  if (state.drop) {
    const d = q('.drop');
    d.setAttribute('fill', state.drop);
    st.svg.classList.remove('dropping');
    void st.svg.getBoundingClientRect(); // Animation neu starten
    st.svg.classList.add('dropping');
  }
}

const RESET_STATE = { ppt: 0, top: null, bubbles: false, limeBubbles: false, lime: 'clear', bath: false, odor: false, glim: 'off', haloScale: 0 };

function resetUnit(u, st) {
  if (st.busy) return;
  applyState(u, st, { ...RESET_STATE, ...u.init });
  st.status.textContent = 'Neu angesetzt. Bereit.';
  delete store.data.done[u.id];
  store.save();
  updateButtons(u, st);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

async function runAction(u, st, action) {
  if (st.busy || !action) return;
  st.busy = true;
  updateButtons(u, st);
  const factor = reducedMotion.matches ? 0.35 : 1;
  for (const step of action.steps) {
    await sleep(step.wait * factor);
    applyState(u, st, step);
    if (step.text) st.status.textContent = step.text;
  }
  await sleep(600 * factor);
  st.busy = false;
  const done = (store.data.done[u.id] ||= {});
  done[action.key] = true;
  writeResults(action.result, true);
  store.save();
  updateButtons(u, st);
}

function updateButtons(u, st) {
  const done = store.data.done[u.id] || {};
  st.el.querySelectorAll('button[data-action]').forEach((b) => {
    const key = b.dataset.action;
    const action = u.actions.find((a) => a.key === key);
    if (key === 'reset') { b.disabled = st.busy; return; }
    b.disabled = st.busy || (action.requires && !done[action.requires]) || !!done[key];
  });
}

/** Zustand nach erneutem Laden wiederherstellen (ohne Animation abzuwarten) */
function restoreUnits() {
  for (const u of UNITS) {
    const st = unitState.get(u.id);
    const done = store.data.done[u.id] || {};
    for (const a of u.actions) {
      if (!done[a.key]) continue;
      const merged = Object.assign({}, ...a.steps.map(({ drop, wait, text, ...rest }) => rest));
      applyState(u, st, merged);
      st.status.textContent = a.steps.at(-1).text;
    }
    updateButtons(u, st);
  }
}

/* ------------------------------------------------------------------ *
 * Rendering: Tabellen
 * ------------------------------------------------------------------ */
const selectCells = []; // { id, correct }

function renderTables() {
  for (const t of TABLES) {
    const mount = document.getElementById(t.mount);
    const capId = `cap-${t.id}`;
    const head = t.cols.map(([, label]) => `<th scope="col">${label}</th>`).join('');
    const body = t.rows.map((r) => {
      const cells = t.cols.map(([ck, clabel]) => {
        const c = r.cells[ck];
        const label = clabel;
        if (!c) return `<td data-label="${label}"></td>`;
        if (c.type === 'given') return `<td class="given" data-label="${label}">${ce(c.text)}</td>`;
        if (c.type === 'obs') return `<td class="obs" data-label="${label}" data-cell="${r.key}:${ck}"></td>`;
        const id = `sel-${t.id}-${r.key}-${ck}`;
        selectCells.push({ id, correct: c.correct, explain: c.explain, hint: c.hint, options: r.options });
        const opts = OPT[r.options].map(([v, txt]) => `<option value="${v}">${ceU(txt)}</option>`).join('');
        return `<td class="answer" data-label="${label}">
          <select id="${id}" aria-label="${stripTags(r.label)} – ${stripTags(label)}" aria-describedby="${id}-fb">
            <option value="" selected disabled>– bitte wählen –</option>${opts}
          </select>
          <div class="feedback" id="${id}-fb" aria-live="polite"></div>
        </td>`;
      }).join('');
      return `<tr><th scope="row">${ce(r.label)}</th>${cells}</tr>`;
    }).join('');
    mount.innerHTML = `
      <div class="table-wrapper" tabindex="0" role="region" aria-labelledby="${capId}">
        <table class="data-table">
          <caption id="${capId}">${ce(t.caption)}</caption>
          <thead><tr><th scope="col">Auswertung</th>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  }

  document.querySelector('main').addEventListener('change', (e) => {
    const sel = e.target.closest('select[id^="sel-"]');
    if (!sel) return;
    const cell = selectCells.find((c) => c.id === sel.id);
    store.data.sel[sel.id] = sel.value;
    if (sel.value !== cell.correct) store.data.tries[sel.id] = (store.data.tries[sel.id] || 0) + 1;
    store.save();
    showFeedback(sel, cell);
    updateProgress();
  });
}

function stripTags(html) { return ceU(html).replace(/<[^>]+>/g, ''); }

function showFeedback(sel, cell) {
  const td = sel.closest('td');
  const fb = td.querySelector('.feedback');
  const ok = sel.value === cell.correct;
  td.classList.toggle('is-ok', ok);
  td.classList.toggle('is-bad', !ok && sel.value !== '');
  sel.setAttribute('aria-invalid', ok ? 'false' : 'true');
  if (!sel.value) { fb.innerHTML = ''; return; }
  if (ok) {
    fb.innerHTML = `✓ Richtig. ${cell.explain}`;
  } else {
    const tries = store.data.tries[sel.id] || 0;
    const solutionText = ceU(OPT[cell.options].find(([v]) => v === cell.correct)[1]);
    fb.innerHTML = `✗ Noch nicht richtig. Tipp: ${cell.hint}` +
      (tries >= 2 ? `<span class="reveal"><strong>Lösung:</strong> ${solutionText}. ${cell.explain}</span>` : '');
  }
}

function writeResults(result, save) {
  for (const [cellKey, text] of Object.entries(result)) {
    document.querySelectorAll(`td[data-cell="${cellKey}"]`).forEach((td) => { td.textContent = text; });
    if (save) store.data.obs[cellKey] = text;
  }
}

function restoreTables() {
  writeResults(store.data.obs, false);
  for (const cell of selectCells) {
    const v = store.data.sel[cell.id];
    if (!v) continue;
    const sel = document.getElementById(cell.id);
    sel.value = v;
    showFeedback(sel, cell);
  }
}

function updateProgress() {
  const total = selectCells.length;
  const correct = selectCells.filter((c) => store.data.sel[c.id] === c.correct).length;
  document.getElementById('progress-text').textContent = `${correct} / ${total} richtig`;
  const bar = document.getElementById('progress-bar');
  bar.max = total;
  bar.value = correct;
}

/* ------------------------------------------------------------------ *
 * Rendering: Aufgaben
 * ------------------------------------------------------------------ */
function renderTasks() {
  const mount = document.getElementById('tasks');
  mount.innerHTML = TASKS.map((t) => `
    <article class="task" id="${t.id}">
      <h3>${t.title}</h3>
      ${t.hint ? `<p class="callout callout-hint"><strong>${t.hint}</strong></p>` : ''}
      ${t.body}
      <label for="${t.id}-notes">Eigene Notizen / Lösungsansatz</label>
      <textarea id="${t.id}-notes" data-notes="${t.id}" placeholder="Stichpunkte …"></textarea>
      <details class="solution">
        <summary>Ausführliche Lösung anzeigen</summary>
        <div class="solution-body">${t.solution}</div>
      </details>
    </article>`).join('');

  mount.querySelectorAll('textarea[data-notes]').forEach((ta) => {
    ta.value = store.data.notes[ta.dataset.notes] || '';
    ta.addEventListener('input', () => {
      store.data.notes[ta.dataset.notes] = ta.value;
      store.save();
    });
  });
}

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */
function init() {
  renderUnits();
  renderTables();
  renderTasks();
  restoreTables();
  restoreUnits();
  updateProgress();

  document.getElementById('reset-all').addEventListener('click', () => {
    if (!confirm('Alle Beobachtungen, Antworten und Notizen löschen?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignorieren */ }
    location.reload();
  });
}

init();
