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
export function domiReply(text, properties) {
  const q = text.toLowerCase();
  if (/description|write.*listing/.test(q))
    return "A clear description should include your property’s real location, room type, monthly rent, deposit and advance, utilities, amenities, current vacancies and house rules. Keep promises specific and confirm every detail. You can describe the room’s natural light or study space only if the property genuinely has them.";
  if (/draft|message|reply/.test(q))
    return "Here’s a draft you can edit: “Hello! I’m interested in your room. Could you confirm the current vacancy, total move-in cost, included utilities, and a convenient time for a viewing? Thank you!”";
  if (/deposit|advance|cost|price/.test(q))
    return "Your move-in cost may include the first month’s rent, an advance payment and a refundable deposit. Check each listing’s terms and ask the owner which utilities are separate. I only use owner-provided prices.";
  const amount = q.match(
    /(?:₱|php|under|budget|below)\s*(?:₱|php)?\s*([\d,]+)/i,
  );
  const budget = amount ? Number(amount[1].replaceAll(",", "")) : 0;
  const matches = properties.filter(
    (p) => p.available > 0 && (!budget || p.minPrice <= budget),
  );
  if (!properties.length)
    return "There aren’t any loaded listings for me to match yet. Try Explore rooms when listings are available, or post a Kwarto Wanted request. I can also help you understand deposits or draft a message to an owner.";
  return matches.length
    ? `From the listings loaded, ${matches.length} ${matches.length === 1 ? "property matches" : "properties match"}${budget ? ` your ${money(budget)} budget` : ""}: ${matches
        .slice(0, 3)
        .map((p) => `${p.title} (from ${money(p.minPrice)}/month)`)
        .join(
          "; ",
        )}. Vacancy is owner-reported; confirm directly before visiting.`
    : "No loaded listings match that budget with reported vacancies. Try a wider budget or post a Kwarto Wanted request.";
}
