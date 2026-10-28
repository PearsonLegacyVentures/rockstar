// Cloudflare Pages Function — requires BOOKING_TO_EMAIL, BOOKING_FROM_EMAIL,
// RESEND_API_KEY. Credentials must be set as encrypted Cloudflare secrets.
// Requests are only accepted after the owner configures those secrets.
const response = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY || !env.BOOKING_TO_EMAIL || !env.BOOKING_FROM_EMAIL) {
    return response({ ok: false, message: "Booking requests are not configured yet." }, 503);
  }
  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    return response({ ok: false, message: "Expected JSON." }, 415);
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 12000) return response({ ok: false, message: "Request too large." }, 413);
  let form;
  try {
    const raw = await request.text();
    if (raw.length > 12000) return response({ ok: false, message: "Request too large." }, 413);
    form = JSON.parse(raw);
  } catch (_) {
    return response({ ok: false, message: "Invalid booking request." }, 400);
  }
  if (!form || typeof form !== "object" || Array.isArray(form)) {
    return response({ ok: false, message: "Invalid booking request." }, 400);
  }
  if (form.company) {
    // Spam honeypot: acknowledge without delivering.
    return response({ ok: true }, 200);
  }
  const clean = (value, max) => typeof value === "string"
    ? value.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, max)
    : "";
  const data = {
    service: clean(form.service, 150),
    date: clean(form.date, 10),
    guests: Number(form.guests),
    name: clean(form.name, 120),
    email: clean(form.email, 160),
    pickupType: clean(form.pickupType, 80),
    pickupLocation: clean(form.pickupLocation, 160),
    notes: clean(form.notes, 1800)
  };
  const allowed = new Set([
    "Nassau sightseeing and island excursions",
    "Family reunions and private group tours",
    "Cruise ship passenger transportation and tours",
    "ATV rentals and adventure experiences",
    "Swimming-with-the-pigs excursion booking",
    "Hotel pickups and tours",
    "Custom Nassau experience"
  ]);
  const dateValue = Date.parse(data.date + "T00:00:00Z");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Nassau", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = kind => parts.find(item => item.type === kind).value;
  const today = part("year") + "-" + part("month") + "-" + part("day");
  if (!allowed.has(data.service) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
    !Number.isFinite(dateValue) ||
    data.date < today ||
    !Number.isInteger(data.guests) ||
    data.guests < 1 || data.guests > 250 ||
    data.name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    !data.pickupType ||
    !["Cruise ship", "Hotel or resort", "Vacation rental / Airbnb", "Other / not sure"].includes(data.pickupType)) {
    return response({ ok: false, message: "Please check your booking details." }, 400);
  }
  const plainText = [
    "NEW ROCKSTAR BOOKING REQUEST",
    "Experience: " + data.service,
    "Date (Bahamas): " + data.date,
    "Guest count: " + data.guests,
    "Name: " + data.name,
    "Customer email: " + data.email,
    "Pickup type: " + data.pickupType,
    "Ship/hotel/location: " + (data.pickupLocation || "Not specified"),
    "Additional notes: " + (data.notes || "None"),
    "",
    "This request is NOT a confirmed booking. Verify availability and send a final quote."
  ].join("\n");

  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.BOOKING_FROM_EMAIL,
        to: [env.BOOKING_TO_EMAIL],
        reply_to: data.email,
        subject: "Rockstar Nassau — " + data.service,
        text: plainText
      })
    });
    if (!result.ok) {
      return response({ ok: false, message: "Request delivery is unavailable. Please try again later." }, 502);
    }
    return response({ ok: true, message: "Booking inquiry sent." }, 200);
  } catch (_) {
    return response({ ok: false, message: "Request delivery is unavailable. Please try again later." }, 502);
  }
}