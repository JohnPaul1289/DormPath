export const TYPES = [
  "Boarding house",
  "Dormitory",
  "Apartment",
  "Studio",
  "Solo room",
  "Sharing room",
  "Bedspace",
];
export const AMENITIES = [
  "Wi-Fi",
  "Air conditioning",
  "Kitchen",
  "Laundry",
  "Parking",
  "Private bathroom",
  "Study area",
  "CCTV",
];
export const TUGUEGARAO_BARANGAYS = [
  "Annafunan East", "Annafunan West", "Atulayan Norte", "Atulayan Sur",
  "Bagay", "Buntun", "Caggay", "Capatan", "Carig Norte", "Carig Sur",
  "Caritan Centro", "Caritan Norte", "Caritan Sur", "Cataggaman Nuevo",
  "Cataggaman Pardo", "Cataggaman Viejo", "Centro 01", "Centro 02",
  "Centro 03", "Centro 04", "Centro 05", "Centro 06", "Centro 07",
  "Centro 08", "Centro 09", "Centro 10", "Centro 11", "Centro 12",
  "Dadda", "Gosi Norte", "Gosi Sur", "Larion Alto", "Larion Bajo",
  "Leonarda", "Libag Norte", "Libag Sur", "Linao East", "Linao Norte",
  "Linao West", "Nambbalan Norte", "Nambbalan Sur", "Pallua Norte",
  "Pallua Sur", "Pengue-Ruyu", "San Gabriel", "Tagga", "Tanza",
  "Ugac Norte", "Ugac Sur"
];

export const PENABLANCA_BARANGAYS = [
  "Aggalo (Peñablanca)",
  "Alimanao (Peñablanca)",
  "Baliuag (Peñablanca)",
  "Bical (Peñablanca)",
  "Bugatay (Peñablanca)",
  "Buyun (Peñablanca)",
  "Cabasan (Peñablanca)",
  "Cabbo (Peñablanca)",
  "Callao (Peñablanca)",
  "Camasi (Peñablanca)",
  "Centro (Peñablanca)",
  "Dodan (Peñablanca)",
  "Lapi (Peñablanca)",
  "Malibabag (Peñablanca)",
  "Manga (Peñablanca)",
  "Minanga (Peñablanca)",
  "Nabbabalayan (Peñablanca)",
  "Nabbuan (Peñablanca)",
  "Parabba (Peñablanca)",
  "Patagueleg (Peñablanca)",
  "Quibal (Peñablanca)",
  "San Roque (Peñablanca)",
  "Sisim (Peñablanca)",
  "Taguing (Peñablanca)"
];

export const ALL_BARANGAYS = [
  ...TUGUEGARAO_BARANGAYS,
  ...PENABLANCA_BARANGAYS
];

export const BARANGAY_COORDINATES = {
  // Tuguegarao City
  "Annafunan East": [121.7394, 17.6358],
  "Annafunan West": [121.7302, 17.6367],
  "Atulayan Norte": [121.7356, 17.6253],
  "Atulayan Sur": [121.7368, 17.6201],
  "Bagay": [121.7167, 17.6472],
  "Buntun": [121.6989, 17.6156],
  "Caggay": [121.7483, 17.6478],
  "Capatan": [121.7612, 17.5894],
  "Carig Norte": [121.7583, 17.6625],
  "Carig Sur": [121.7542, 17.6531],
  "Caritan Centro": [121.7214, 17.6289],
  "Caritan Norte": [121.7208, 17.6350],
  "Caritan Sur": [121.7219, 17.6236],
  "Cataggaman Nuevo": [121.7119, 17.6033],
  "Cataggaman Pardo": [121.7056, 17.6083],
  "Cataggaman Viejo": [121.7031, 17.5994],
  "Centro 01": [121.7289, 17.6136],
  "Centro 02": [121.7264, 17.6142],
  "Centro 03": [121.7258, 17.6167],
  "Centro 04": [121.7236, 17.6158],
  "Centro 05": [121.7219, 17.6147],
  "Centro 06": [121.7239, 17.6125],
  "Centro 07": [121.7256, 17.6111],
  "Centro 08": [121.7278, 17.6100],
  "Centro 09": [121.7311, 17.6117],
  "Centro 10": [121.7306, 17.6161],
  "Centro 11": [121.7300, 17.6189],
  "Centro 12": [121.7267, 17.6214],
  "Dadda": [121.7750, 17.5750],
  "Gosi Norte": [121.7389, 17.5917],
  "Gosi Sur": [121.7361, 17.5833],
  "Larion Alto": [121.7556, 17.6056],
  "Larion Bajo": [121.7528, 17.6139],
  "Leonarda": [121.7417, 17.6278],
  "Libag Norte": [121.7444, 17.6111],
  "Libag Sur": [121.7417, 17.6056],
  "Linao East": [121.7083, 17.6417],
  "Linao Norte": [121.7056, 17.6500],
  "Linao West": [121.6972, 17.6444],
  "Nambbalan Norte": [121.6889, 17.6639],
  "Nambbalan Sur": [121.6917, 17.6556],
  "Pallua Norte": [121.7083, 17.6278],
  "Pallua Sur": [121.7056, 17.6222],
  "Pengue-Ruyu": [121.7472, 17.6361],
  "San Gabriel": [121.7167, 17.6250],
  "Tagga": [121.7639, 17.5806],
  "Tanza": [121.7306, 17.6306],
  "Ugac Norte": [121.7167, 17.6111],
  "Ugac Sur": [121.7194, 17.6056],

  // Peñablanca, Cagayan
  "Aggalo (Peñablanca)": [121.7820, 17.6520],
  "Alimanao (Peñablanca)": [121.7610, 17.6510],
  "Baliuag (Peñablanca)": [121.8020, 17.6180],
  "Bical (Peñablanca)": [121.7910, 17.6320],
  "Bugatay (Peñablanca)": [121.8150, 17.6250],
  "Buyun (Peñablanca)": [121.8210, 17.6090],
  "Cabasan (Peñablanca)": [121.8340, 17.6140],
  "Cabbo (Peñablanca)": [121.7950, 17.6050],
  "Callao (Peñablanca)": [121.8200, 17.7050],
  "Camasi (Peñablanca)": [121.7780, 17.6430],
  "Centro (Peñablanca)": [121.7940, 17.6280],
  "Dodan (Peñablanca)": [121.7890, 17.6150],
  "Lapi (Peñablanca)": [121.8410, 17.6480],
  "Malibabag (Peñablanca)": [121.7850, 17.6620],
  "Manga (Peñablanca)": [121.8120, 17.6390],
  "Minanga (Peñablanca)": [121.8010, 17.6470],
  "Nabbabalayan (Peñablanca)": [121.8290, 17.6310],
  "Nabbuan (Peñablanca)": [121.8390, 17.6620],
  "Parabba (Peñablanca)": [121.7750, 17.6290],
  "Patagueleg (Peñablanca)": [121.7920, 17.6710],
  "Quibal (Peñablanca)": [121.8140, 17.6890],
  "San Roque (Peñablanca)": [121.7830, 17.6380],
  "Sisim (Peñablanca)": [121.8100, 17.6590],
  "Taguing (Peñablanca)": [121.8280, 17.6740],

  // Friendly aliases
  "Alimanao": [121.7610, 17.6510],
  "Camasi": [121.7780, 17.6430],
  "Callao": [121.8200, 17.7050],
  "Dodan": [121.7890, 17.6150],
  "Peñablanca": [121.7940, 17.6280],
  "Penablanca": [121.7940, 17.6280]
};
export const money = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function validateRoom(room) {
  if (!room.name?.trim() || room.name.length > 100)
    throw Error("Enter a room name (up to 100 characters).");
  if (!TYPES.includes(room.type)) throw Error("Select a valid room type.");
  if (
    !Number.isInteger(room.capacity) ||
    room.capacity < 1 ||
    room.capacity > 100
  )
    throw Error("Capacity must be 1–100.");
  if (
    !Number.isInteger(room.available) ||
    room.available < 0 ||
    room.available > room.capacity
  )
    throw Error("Available spaces must be between zero and room capacity.");
  if (!Number.isFinite(room.price) || room.price < 0 || room.price > 1000000)
    throw Error("Enter a valid monthly price.");
  return room;
}
export function filterProperties(properties, filters = {}) {
  const term = (filters.q || "").toLowerCase().trim();
  return properties.filter(
    (p) =>
      (!term ||
        `${p.title} ${p.barangay} ${p.school} ${p.address}`
          .toLowerCase()
          .includes(term)) &&
      (!filters.type || p.roomTypes?.includes(filters.type)) &&
      (!filters.budget || p.minPrice <= Number(filters.budget)) &&
      (!filters.vacant || p.available > 0) &&
      (!filters.amenities?.length ||
        filters.amenities.every((a) => p.amenities?.includes(a))),
  );
}
export function summarizeRooms(rooms) {
  return {
    available: rooms.reduce((n, r) => n + r.available, 0),
    capacity: rooms.reduce((n, r) => n + r.capacity, 0),
    minPrice: rooms.length ? Math.min(...rooms.map((r) => r.price)) : 0,
    roomTypes: [...new Set(rooms.map((r) => r.type))],
  };
}
export function domiReply(text, properties = []) {
  const q = text.toLowerCase().trim();

  // Social media captions / Facebook posts / promotions
  if (/caption|facebook|\bfb\b|social media|post.*about|promo|advertise|marketing/.test(q)) {
    return `Here are engaging Facebook captions you can share about DormPath:

Option 1 (For Students & Boarders):
"Looking for a safe, verified boarding house in Tuguegarao City? 🏡 Explore DormPath! Check real-time room vacancies, view verified amenities, and get 3D directions near CSU Carig, CSU Andrews, USL, and SPUP. 100% free for students! 🎓✨
#DormPath #TuguegaraoBoardingHouse #StudentHousing #CSU #USL #SPUP"

Option 2 (For Landlords & Property Owners):
"Tuguegarao landlords! List your rooms and bedspaces on DormPath to connect directly with university students. Easy room vacancy management, verified inquiries, and zero broker fees. Join DormPath today! 🏠📋
#DormPath #TuguegaraoRentals #BoardingHouse #LandlordsPH"

Option 3 (Quick & Catchy):
"Stress-free dorm hunting starts here. Browse verified dorms in Tuguegarao with DormPath! 🚀📍 #DormPath #Tuguegarao"`;
  }

  // Anti-scam and security guidelines
  if (/scam|phish|fake|safe|fraud|beware/.test(q)) {
    return "Safety first! (1) Never send reservation money via GCash or wire transfer before inspecting the room in person. (2) Look for the 'Verified Owner' badge on DormPath before transacting. (3) Always formalize agreements with a written receipt or tenancy contract specifying monthly rent and deposit refund conditions. (4) DormPath is free for tenants and will never request your password or payment.";
  }

  // Greetings & introduction
  if (/^(hello|hi|kumusta|hey|good (morning|afternoon|evening)|yo\b)/.test(q) || /who are you|what can you do|about you/.test(q)) {
    return "Kumusta! I am DOMI, your 24/7 Tuguegarao housing guide. You can ask me to find rooms under your budget (e.g., 'rooms under ₱3,000'), explain advance and deposit rules, find dorms near your school (CSU Carig/Andrews, USL, SPUP), draft polite inquiry messages to landlords, or create Facebook captions!";
  }

  // Campus locations and transportation
  if (/csu|carig|andrews|usl|spup|university|campus|school|tricycle|fare|commute/.test(q)) {
    return "Tuguegarao tenant housing is centered around CSU Carig (Carig Sur - Engineering, Med, Tech), CSU Andrews (Caritan/Centro - Education, Arts), USL (Mabini St. - Engineering, Business), and SPUP (Mabini St. - Nursing, Allied Health). Tricycle fares within the city center are typically ₱15–₱25 with student discount. You can use our 3D Map View to find places within easy walking or riding distance!";
  }

  // Amenities and utilities
  if (/wifi|wi-fi|aircon|\bac\b|kitchen|laundry|wash|utilities|electric|water|submeter/.test(q)) {
    return "Many tenant boarding houses in Tuguegarao feature high-speed Wi-Fi for coursework and air conditioning for the warm climate. Check each property's 'Utilities policy' on the details page to confirm if electricity for air conditioning is sub-metered or bundled into the monthly rent.";
  }

  // Listing description drafting for landlords
  if (/description|write.*listing|how to describe/.test(q)) {
    return "A clear description should include your property’s real location, room type, monthly rent, deposit and advance, utilities, amenities, current vacancies and house rules. Keep promises specific and confirm every detail. You can describe the room’s natural light or study space only if the property genuinely has them.";
  }

  // Message draft for landlord inquiry
  if (/draft|message|reply|inquir|how to ask/.test(q)) {
    return "Here’s a draft you can edit: “Hello! I’m interested in your room. Could you confirm the current vacancy, total move-in cost, included utilities, and a convenient time for a viewing? Thank you!”";
  }

  // Deposit, advance, and lease terms
  if (/deposit|advance|cost|lease|contract|rent control|refund/.test(q)) {
    return "Your move-in cost typically includes 1 month advance payment and a 1 month refundable security deposit. Check each listing’s terms and ask the owner which utilities are separate. Always ask for a written receipt and confirm refund terms before moving in.";
  }

  // About DormPath platform
  if (/what is dormpath|about dormpath|how dormpath works|is dormpath free/.test(q)) {
    return "DormPath is an official student housing and boarding house locator designed specifically for Tuguegarao City and Peñablanca. It features verified owner inspections (including Mayor's Permits), accurate 3D map directions to campuses, real-time vacancy tracking, and direct landlord messaging. It is 100% free for students!";
  }

  // Budget & room searching
  const amountMatch = q.match(/(?:₱|php|under|budget|below|less than)\s*(?:₱|php)?\s*([\d,]+)/i);
  const isSearchQuery = Boolean(amountMatch) || /room|dorm|boarding|bedspace|rent|apartment|house|place|stay|avail|find|search/.test(q);

  if (isSearchQuery) {
    const budget = amountMatch ? Number(amountMatch[1].replaceAll(",", "")) : 0;
    if (!properties || !properties.length) {
      return "There aren’t any loaded listings for me to match yet. Try exploring the Area Map or browsing rooms when listings are available. I can also help you understand deposits or draft a message to an owner.";
    }

    const matches = properties.filter(
      (p) => p.available > 0 && (!budget || p.minPrice <= budget)
    );

    return matches.length
      ? `From the listings loaded, ${matches.length} ${matches.length === 1 ? "property matches" : "properties match"}${budget ? ` your ${money(budget)} budget` : ""}: ${matches
          .slice(0, 3)
          .map((p) => `${p.title} (from ${money(p.minPrice)}/month)`)
          .join("; ")}. Vacancy is owner-reported; confirm directly before visiting.`
      : "No loaded listings match that budget with reported vacancies. Try adjusting your budget or explore the Area Map.";
  }

  // General conversational response
  return "Kumusta! I am DOMI, your Tuguegarao housing assistant. I can help you find verified boarding houses near CSU Carig/Andrews, USL, and SPUP, check rental budgets, explain deposit policies, draft landlord inquiries, or write social media captions for DormPath. What would you like help with today?";
}

export function domiLoaderHtml(size = "section", progress = null) {
  const isDeterminate = typeof progress === "number" && progress >= 0 && progress <= 100;
  const isButton = size === "button";

  if (isButton) {
    return `<span class="domi-loader domi-loader-button" role="status" aria-label="Loading"><span class="domi-sr-only">Loading</span><span class="domi-ring-container"><span class="domi-ring-track" aria-hidden="true"></span><span class="domi-spinner-rotator" aria-hidden="true"><span class="domi-conic-arc"></span><span class="domi-comet-head"></span></span></span></span>`;
  }

  if (isDeterminate) {
    const pct = Math.round(progress);
    const deg = (pct / 100) * 360;
    return `<div class="domi-loader domi-loader-${size}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Upload progress: ${pct}%"><span class="domi-sr-only">${pct}% completed</span><div class="domi-ring-container"><div class="domi-ambient-glow" aria-hidden="true"></div><div class="domi-ring-track" aria-hidden="true"></div><div class="domi-spinner-rotator" aria-hidden="true" style="animation:none; transform:rotate(${deg}deg);"><div class="domi-conic-arc" style="background:conic-gradient(from 0deg, #00f5ff 0deg, #38bdf8 ${deg * 0.4}deg, #8b5cf6 ${deg}deg, transparent ${deg}deg);"></div><div class="domi-comet-head" style="opacity:${pct > 0 ? 1 : 0};"></div></div><div class="domi-mascot-pod" aria-hidden="true"><img src="/domi-loader.png" alt="" class="domi-mascot-img" onerror="if(this.dataset.fb){this.onerror=null;this.style.visibility='hidden'}else{this.dataset.fb='1';this.src='/icon-192.png'}" /><div class="domi-mascot-shadow"></div></div></div></div>`;
  }

  return `<div class="domi-loader domi-loader-${size} domi-fade-in" role="status" aria-label="Loading"><span class="domi-sr-only">Loading</span><div class="domi-ring-container"><div class="domi-ambient-glow" aria-hidden="true"></div><div class="domi-ring-track" aria-hidden="true"></div><div class="domi-spinner-rotator" aria-hidden="true"><div class="domi-conic-arc"></div><div class="domi-comet-head"></div></div><div class="domi-mascot-pod" aria-hidden="true"><img src="/domi-loader.png" alt="" class="domi-mascot-img" onerror="if(this.dataset.fb){this.onerror=null;this.style.visibility='hidden'}else{this.dataset.fb='1';this.src='/icon-192.png'}" /><div class="domi-mascot-shadow"></div></div></div></div>`;
}

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km) {
  if (km == null || isNaN(km)) return "";
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export const NOTABLE_LANDMARKS = [
  { name: "University of Saint Louis (USL)", short: "USL", lat: 17.6056, lng: 121.7228 },
  { name: "St. Paul University Philippines (SPUP)", short: "SPUP", lat: 17.6160, lng: 121.7210 },
  { name: "CSU Andrews (Main Campus)", short: "CSU Andrews", lat: 17.6189, lng: 121.7197 },
  { name: "CSU Carig Campus", short: "CSU Carig", lat: 17.6534, lng: 121.7501 },
  { name: "Cagayan Valley Medical Center (CVMC)", short: "CVMC", lat: 17.6565, lng: 121.7516 },
  { name: "Tuguegarao City Hall", short: "City Hall", lat: 17.6508, lng: 121.7482 },
  { name: "SM Center Tuguegarao Downtown", short: "SM Downtown", lat: 17.6142, lng: 121.7265 },
  { name: "Robinsons Place Tuguegarao", short: "Robinsons", lat: 17.6042, lng: 121.7348 }
];
