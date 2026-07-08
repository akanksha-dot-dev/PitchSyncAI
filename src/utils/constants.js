/* ============================================================
   FIFA MatchDay GenAI Nexus — Constants & Mock Data
   Stadium definitions, translations, templates, generators
   ============================================================ */

// ---- Supported Languages ----
export const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸', dir: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  pt: { name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  de: { name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  ja: { name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  ko: { name: '한국어', flag: '🇰🇷', dir: 'ltr' },
  zh: { name: '中文', flag: '🇨🇳', dir: 'ltr' },
  hi: { name: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
};

// ---- FIFA 2026 Venues ----
export const VENUES = [
  { id: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, NJ', capacity: 82500, country: 'USA' },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Inglewood, CA', capacity: 70240, country: 'USA' },
  { id: 'att', name: 'AT&T Stadium', city: 'Arlington, TX', capacity: 80000, country: 'USA' },
  { id: 'hard_rock', name: 'Hard Rock Stadium', city: 'Miami Gardens, FL', capacity: 64767, country: 'USA' },
  { id: 'lumen', name: 'Lumen Field', city: 'Seattle, WA', capacity: 69000, country: 'USA' },
  { id: 'lincoln', name: 'Lincoln Financial Field', city: 'Philadelphia, PA', capacity: 69796, country: 'USA' },
  { id: 'arrowhead', name: 'GEHA Field at Arrowhead', city: 'Kansas City, MO', capacity: 76416, country: 'USA' },
  { id: 'nrg', name: 'NRG Stadium', city: 'Houston, TX', capacity: 72220, country: 'USA' },
  { id: 'gillette', name: 'Gillette Stadium', city: 'Foxborough, MA', capacity: 65878, country: 'USA' },
  { id: 'mercedes', name: 'Mercedes-Benz Stadium', city: 'Atlanta, GA', capacity: 71000, country: 'USA' },
  { id: 'bmo', name: 'BMO Field', city: 'Toronto, ON', capacity: 45500, country: 'Canada' },
  { id: 'bc_place', name: 'BC Place', city: 'Vancouver, BC', capacity: 54500, country: 'Canada' },
  { id: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', capacity: 87523, country: 'Mexico' },
  { id: 'akron', name: 'Estadio Akron', city: 'Guadalajara', capacity: 49850, country: 'Mexico' },
  { id: 'bbva', name: 'Estadio BBVA', city: 'Monterrey', capacity: 53500, country: 'Mexico' },
];

// Active venue (default)
export const ACTIVE_VENUE = VENUES[0];

// ---- Stadium Zones ----
export const STADIUM_ZONES = {
  gate_a: { id: 'gate_a', name: 'Gate A (North)', type: 'gate', x: 200, y: 50, capacity: 5000 },
  gate_b: { id: 'gate_b', name: 'Gate B (NE)', type: 'gate', x: 350, y: 80, capacity: 4500 },
  gate_c: { id: 'gate_c', name: 'Gate C (East)', type: 'gate', x: 420, y: 200, capacity: 5000 },
  gate_d: { id: 'gate_d', name: 'Gate D (SE)', type: 'gate', x: 350, y: 320, capacity: 4500 },
  gate_e: { id: 'gate_e', name: 'Gate E (South)', type: 'gate', x: 200, y: 370, capacity: 5000 },
  gate_f: { id: 'gate_f', name: 'Gate F (SW)', type: 'gate', x: 60, y: 320, capacity: 4500 },
  gate_g: { id: 'gate_g', name: 'Gate G (West)', type: 'gate', x: 10, y: 200, capacity: 5000 },
  gate_h: { id: 'gate_h', name: 'Gate H (NW)', type: 'gate', x: 60, y: 80, capacity: 4500 },
  section_100: { id: 'section_100', name: 'Lower Bowl (North)', type: 'section', x: 200, y: 120, capacity: 8000 },
  section_200: { id: 'section_200', name: 'Lower Bowl (South)', type: 'section', x: 200, y: 290, capacity: 8000 },
  section_300: { id: 'section_300', name: 'Upper Deck (East)', type: 'section', x: 340, y: 200, capacity: 10000 },
  section_400: { id: 'section_400', name: 'Upper Deck (West)', type: 'section', x: 80, y: 200, capacity: 10000 },
  concourse_n: { id: 'concourse_n', name: 'North Concourse', type: 'concourse', x: 200, y: 85, capacity: 3000 },
  concourse_s: { id: 'concourse_s', name: 'South Concourse', type: 'concourse', x: 200, y: 330, capacity: 3000 },
  food_court_e: { id: 'food_court_e', name: 'East Food Court', type: 'food', x: 380, y: 200, capacity: 2000 },
  food_court_w: { id: 'food_court_w', name: 'West Food Court', type: 'food', x: 40, y: 200, capacity: 2000 },
  medical_1: { id: 'medical_1', name: 'Medical Station 1', type: 'medical', x: 120, y: 120, capacity: 50 },
  medical_2: { id: 'medical_2', name: 'Medical Station 2', type: 'medical', x: 300, y: 290, capacity: 50 },
  vip_lounge: { id: 'vip_lounge', name: 'VIP Lounge', type: 'vip', x: 200, y: 200, capacity: 1500 },
  field: { id: 'field', name: 'Playing Field', type: 'field', x: 200, y: 200, capacity: 0 },
};

// ---- Zone Type Icons ----
export const ZONE_ICONS = {
  gate: '🚪',
  section: '🏟️',
  concourse: '🚶',
  food: '🍔',
  medical: '🏥',
  vip: '⭐',
  restroom: '🚻',
  field: '⚽',
};

// ---- Accessibility Options ----
export const ACCESSIBILITY_OPTIONS = [
  { id: 'wheelchair', label: 'Wheelchair Accessible', icon: '♿' },
  { id: 'visualImpairment', label: 'Visual Impairment Support', icon: '👁️' },
  { id: 'hearingImpairment', label: 'Hearing Support', icon: '👂' },
  { id: 'lowSensory', label: 'Low Sensory Path', icon: '🤫' },
];

// ---- Transit Modes ----
export const TRANSIT_MODES = {
  metro: { icon: '🚇', name: 'Metro', color: '#1D4ED8' },
  bus: { icon: '🚌', name: 'Bus', color: '#16A34A' },
  shuttle: { icon: '🚐', name: 'Event Shuttle', color: '#D4A843' },
  rideshare: { icon: '🚗', name: 'Rideshare', color: '#7C3AED' },
};

// ---- Mock Transit Schedules ----
export function generateTransitSchedules() {
  const now = new Date();
  const schedules = [];

  const lines = [
    { mode: 'metro', line: 'NJ Transit Line', destination: 'MetLife Stadium', frequency: 8 },
    { mode: 'metro', line: 'PATH Hudson', destination: 'Secaucus Junction', frequency: 12 },
    { mode: 'bus', line: 'Route 160', destination: 'Gate A Drop-off', frequency: 15 },
    { mode: 'shuttle', line: 'FIFA Express', destination: 'Stadium Loop', frequency: 5 },
    { mode: 'rideshare', line: 'Designated Zone', destination: 'Lot K Pickup', frequency: 3 },
  ];

  for (const line of lines) {
    for (let i = 0; i < 4; i++) {
      const departure = new Date(now.getTime() + (i * line.frequency + Math.random() * 5) * 60000);
      const delay = Math.random() > 0.8 ? Math.floor(Math.random() * 8) : 0;
      const capacity = Math.floor(50 + Math.random() * 50);
      schedules.push({
        id: `${line.mode}_${i}`,
        mode: line.mode,
        line: line.line,
        destination: line.destination,
        departure: departure.toISOString(),
        delay,
        capacity,
        accessible: Math.random() > 0.3,
      });
    }
  }

  return schedules.sort((a, b) => new Date(a.departure) - new Date(b.departure));
}

// ---- Mock Crowd Data Generator ----
export function generateCrowdData() {
  const data = {};
  for (const [zoneId, zone] of Object.entries(STADIUM_ZONES)) {
    if (zone.type === 'field') continue;
    const baseDensity = zone.type === 'gate' ? 60 : zone.type === 'section' ? 70 : 40;
    const density = Math.min(100, Math.max(5, baseDensity + (Math.random() - 0.5) * 40));
    const prevDensity = data[zoneId]?.density || density;
    const trend = density > prevDensity + 3 ? 'rising' : density < prevDensity - 3 ? 'falling' : 'stable';

    data[zoneId] = {
      zoneId,
      zoneName: zone.name,
      density: Math.round(density),
      trend,
      count: Math.round((density / 100) * zone.capacity),
      capacity: zone.capacity,
      timestamp: Date.now(),
      alerts: density > 85 ? ['High density warning'] : [],
    };
  }
  return data;
}

// ---- Quick Reply Suggestions ----
export const QUICK_REPLIES = {
  en: [
    '🗺️ Navigate to my seat',
    '🚇 Show transit schedule',
    '🍔 Find food nearby',
    '🏥 Nearest medical station',
    '♿ Accessible routes',
    '🎟️ Show my ticket',
  ],
  es: [
    '🗺️ Ir a mi asiento',
    '🚇 Horario de transporte',
    '🍔 Comida cercana',
    '🏥 Estación médica',
    '♿ Rutas accesibles',
    '🎟️ Ver mi boleto',
  ],
  fr: [
    '🗺️ Aller à ma place',
    '🚇 Horaires transport',
    '🍔 Nourriture à proximité',
    '🏥 Station médicale',
    '♿ Routes accessibles',
    '🎟️ Mon billet',
  ],
};

// ---- GenAI Response Templates ----
export const RESPONSE_TEMPLATES = {
  welcome: {
    en: "Welcome to MetLife Stadium! 🏟️ I'm your AI matchday assistant. I can help you with:\n\n🗺️ **Navigation** — Find your seat, food, restrooms\n🚇 **Transit** — Real-time departure schedules\n♿ **Accessibility** — Wheelchair routes, low-sensory paths\n🌐 **Language** — I speak 10 languages!\n\nHow can I help you today?",
    es: "¡Bienvenido al MetLife Stadium! 🏟️ Soy tu asistente de IA. Puedo ayudarte con:\n\n🗺️ **Navegación** — Encuentra tu asiento, comida, baños\n🚇 **Transporte** — Horarios en tiempo real\n♿ **Accesibilidad** — Rutas para sillas de ruedas\n🌐 **Idiomas** — ¡Hablo 10 idiomas!\n\n¿Cómo puedo ayudarte?",
    fr: "Bienvenue au MetLife Stadium! 🏟️ Je suis votre assistant IA. Je peux vous aider avec:\n\n🗺️ **Navigation** — Trouvez votre siège, nourriture\n🚇 **Transport** — Horaires en temps réel\n♿ **Accessibilité** — Itinéraires accessibles\n🌐 **Langues** — Je parle 10 langues!\n\nComment puis-je vous aider?",
  },

  wayfinding: {
    en: "I've found the best route for you! 🗺️\n\n",
    es: "¡He encontrado la mejor ruta para ti! 🗺️\n\n",
    fr: "J'ai trouvé le meilleur itinéraire! 🗺️\n\n",
  },

  transit: {
    en: "Here are the upcoming departures from the stadium: 🚇\n\n",
    es: "Aquí están las próximas salidas del estadio: 🚇\n\n",
    fr: "Voici les prochains départs du stade: 🚇\n\n",
  },

  food: {
    en: "Here are the nearest food options: 🍔\n\n• **East Food Court** — Burgers, Pizza, Tacos (5 min walk)\n• **West Food Court** — Asian, Mediterranean, Salads (7 min walk)\n• **North Concourse** — Hot Dogs, Pretzels, Drinks (3 min walk)\n\nWould you like directions to any of these?",
    es: "Opciones de comida cercanas: 🍔\n\n• **Food Court Este** — Hamburguesas, Pizza, Tacos (5 min)\n• **Food Court Oeste** — Asiática, Mediterránea, Ensaladas (7 min)\n• **Pasillo Norte** — Hot Dogs, Pretzels, Bebidas (3 min)\n\n¿Quieres direcciones?",
  },

  medical: {
    en: "🏥 **Nearest Medical Station**: Medical Station 1\n📍 North-West section, Level 1\n⏱️ Estimated walk: 2 minutes\n📞 Emergency: Dial #HELP on your phone\n\nShall I guide you there?",
    es: "🏥 **Estación Médica más cercana**: Estación 1\n📍 Sección Noroeste, Nivel 1\n⏱️ Caminata estimada: 2 minutos\n📞 Emergencia: Marque #HELP\n\n¿Quieres que te guíe?",
  },

  accessibility: {
    en: "♿ **Accessible Routes Available**:\n\n1. 🛗 Elevator access at Gates A, C, E, G\n2. 🦽 Wheelchair ramps at all lower-level entrances\n3. 🤫 Low-sensory path via West Concourse\n4. 👂 Hearing loop available in Sections 100-110\n\nI'll always prioritize accessible routes in my directions. What accessibility needs should I keep in mind?",
  },

  crowdWarning: {
    en: "⚠️ **Crowd Alert**: High density detected at {zone}. \nI recommend using {altRoute} instead.\n\nEstimated wait: **{waitTime} minutes** at current route vs. **{altWaitTime} minutes** on alternate.\n\nShall I reroute?",
  },

  fallback: {
    en: "I'm not sure I understood that fully. Could you try rephrasing? I can help with:\n\n• 🗺️ Navigation & wayfinding\n• 🚇 Transit schedules\n• 🍔 Food & facilities\n• ♿ Accessibility\n• 🏥 Medical assistance\n• 🎟️ Ticket information",
    es: "No estoy seguro de haber entendido. ¿Podrías reformular? Puedo ayudar con:\n\n• 🗺️ Navegación\n• 🚇 Transporte\n• 🍔 Comida\n• ♿ Accesibilidad\n• 🏥 Asistencia médica\n• 🎟️ Información de boletos",
  },
};

// ---- Ops Alert Templates ----
export const OPS_ALERT_TEMPLATES = [
  { severity: 'critical', zone: 'gate_a', message: 'Gate A exceeding 90% capacity. Recommend diverting to Gate B or Gate H.', action: 'Deploy 3 additional crowd control units' },
  { severity: 'warning', zone: 'concourse_n', message: 'North Concourse density trending upward rapidly. Pre-game surge expected.', action: 'Open auxiliary walkway' },
  { severity: 'warning', zone: 'food_court_e', message: 'East Food Court queue exceeding 15-minute wait threshold.', action: 'Activate overflow counter' },
  { severity: 'info', zone: 'section_300', message: 'Upper Deck East at 65% capacity. Normal for T-30 minutes.', action: 'Continue monitoring' },
  { severity: 'critical', zone: 'gate_c', message: 'Accessible pathway at Gate C partially blocked by equipment.', action: 'Dispatch accessibility team immediately' },
  { severity: 'warning', zone: 'section_100', message: 'Lower Bowl North experiencing slow ingress. Check scanner equipment.', action: 'Deploy technical support' },
  { severity: 'info', zone: 'medical_1', message: 'Medical Station 1 reporting normal activity. 2 minor incidents handled.', action: 'No action required' },
  { severity: 'warning', zone: 'gate_e', message: 'Transit shuttle backup causing crowd buildup at Gate E drop-off.', action: 'Coordinate with transit authority' },
];

// ---- Resource Types ----
export const RESOURCE_TYPES = [
  { id: 'security', name: 'Security', icon: '🛡️', color: '#1D4ED8', total: 120 },
  { id: 'medical', name: 'Medical', icon: '🏥', color: '#DC2626', total: 40 },
  { id: 'crowdControl', name: 'Crowd Control', icon: '🚧', color: '#EAB308', total: 80 },
  { id: 'accessibility', name: 'Accessibility', icon: '♿', color: '#16A34A', total: 30 },
];

// ---- Mock Wayfinding Routes ----
export const MOCK_ROUTES = {
  seat: [
    { step: 1, instruction: 'Enter through Gate A (North entrance)', distance: '0m', time: '0 min', icon: '🚪' },
    { step: 2, instruction: 'Proceed straight along North Concourse', distance: '120m', time: '2 min', icon: '🚶' },
    { step: 3, instruction: 'Take escalator to Level 2', distance: '15m', time: '1 min', icon: '🔼' },
    { step: 4, instruction: 'Turn left at Section 105 entrance', distance: '45m', time: '1 min', icon: '↪️' },
    { step: 5, instruction: 'Find Row F, Seat 12 — enjoy the match!', distance: '20m', time: '1 min', icon: '💺' },
  ],
  accessible_seat: [
    { step: 1, instruction: 'Enter through Gate A (Accessible entrance)', distance: '0m', time: '0 min', icon: '♿' },
    { step: 2, instruction: 'Take the elevator to Level 2', distance: '30m', time: '2 min', icon: '🛗' },
    { step: 3, instruction: 'Follow the accessible corridor (widened path)', distance: '80m', time: '3 min', icon: '🦽' },
    { step: 4, instruction: 'Accessible seating area, Section 105-A', distance: '15m', time: '1 min', icon: '💺' },
  ],
};

// ---- Mock Ticket ----
export const MOCK_TICKET = {
  matchId: 'WC2026-QF3',
  match: 'Brazil vs. Germany',
  competition: 'FIFA World Cup 2026™ — Quarter Final',
  venue: 'MetLife Stadium',
  date: '2026-07-10',
  time: '20:00',
  gate: 'A',
  section: '105',
  row: 'F',
  seat: '12',
  barcode: 'WC26-QF3-105F12-7B9A',
};
