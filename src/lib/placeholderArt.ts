import { hashString } from "./format";

/**
 * Procedural placeholder artwork (SVG data-URIs). No real people, no network requests,
 * works offline. Production: replace with CDN-hosted, moderated member photos.
 */
const BG: [string, string][] = [
  ["#BFE6E8", "#F6D5CF"], ["#FBD9C9", "#C9E4E6"], ["#D8E6D0", "#F4D9C6"], ["#CFD8F0", "#F7DCCB"],
  ["#F7E1B5", "#BFE0DD"], ["#E3D3F0", "#C7E8E2"], ["#FFD6D0", "#CBE3F0"], ["#CDEBDD", "#F5E3C3"],
];
const SKIN = ["#F3CFB0", "#E8B792", "#D39A72", "#B27650", "#8D5A3A", "#6B4129"];
const HAIR = ["#2A1A12", "#4B2E1B", "#8A5A2B", "#C99A3E", "#A9432E", "#8E8E8E", "#171717"];
const SHIRT = ["#1B6A74", "#0F3A44", "#F9625A", "#E5A93C", "#7FA88C", "#5B6FB5", "#B25D7A", "#3E8E7E"];

const svgUri = (inner: string, w = 600, hgt = 800) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hgt}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`
  )}`;

function person(h: number): string {
  const skin = SKIN[h % 6];
  const hair = HAIR[(h >> 3) % 7];
  const shirt = SHIRT[(h >> 5) % 8];
  const style = (h >> 7) % 5; // 0 short, 1 long, 2 bun, 3 curly, 4 bald
  const glasses = (h >> 9) % 3 === 0;
  const back = style === 1 ? `<path d="M182 430 C170 300 230 252 300 252 C370 252 430 300 418 430 L436 610 L164 610Z" fill="${hair}"/>` : "";
  const bun = style === 2 ? `<circle cx="300" cy="258" r="44" fill="${hair}"/>` : "";
  const curls =
    style === 3
      ? [[212, 340], [248, 292], [300, 276], [352, 292], [388, 340]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="38" fill="${hair}"/>`).join("")
      : "";
  const cap =
    style === 4
      ? ""
      : `<path d="M196 412 C196 300 245 272 300 272 C355 272 404 300 404 412 C386 362 340 338 300 338 C260 338 214 362 196 412Z" fill="${hair}"/>`;
  return `${back}${bun}${curls}
<path d="M64 800 C64 650 180 600 300 600 C420 600 536 650 536 800Z" fill="${shirt}"/>
<rect x="268" y="500" width="64" height="116" rx="30" fill="${skin}"/>
<path d="M246 604 L300 676 L354 604Z" fill="${skin}"/>
<ellipse cx="300" cy="422" rx="104" ry="124" fill="${skin}"/>${cap}
<circle cx="262" cy="428" r="8" fill="#26303a"/><circle cx="338" cy="428" r="8" fill="#26303a"/>
<path d="M266 476 Q300 508 334 476" stroke="#26303a" stroke-width="7" fill="none" stroke-linecap="round"/>
${glasses ? `<g fill="none" stroke="#26303a" stroke-width="5"><circle cx="262" cy="428" r="27"/><circle cx="338" cy="428" r="27"/><path d="M289 428h22"/></g>` : ""}`;
}

function scene(kind: number, c1: string, c2: string, h: number): string {
  const accent = SHIRT[(h >> 4) % 8];
  if (kind === 0) {
    // mountains + sun
    return `<circle cx="450" cy="230" r="70" fill="#FFE9A8" opacity=".95"/>
<path d="M-20 640 L170 360 L300 520 L420 330 L640 640Z" fill="${accent}" opacity=".55"/>
<path d="M-20 700 L130 520 L260 650 L380 470 L640 700Z" fill="#1B6A74" opacity=".8"/>
<rect y="640" width="600" height="160" fill="#0F3A44" opacity=".85"/>
${[90, 180, 250].map((x) => `<path d="M${x} 650 l24 -80 l24 80Z" fill="#7FB89A"/>`).join("")}`;
  }
  if (kind === 1) {
    // city skyline at dusk
    const bars = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const bh = 180 + ((h >> i) % 7) * 40;
      const x = i * 90 - 10;
      const wins = [0, 1, 2, 3].map((r) => `<rect x="${x + 16}" y="${800 - bh + 24 + r * 44}" width="14" height="18" fill="#FFE9A8" opacity=".85"/><rect x="${x + 44}" y="${800 - bh + 24 + r * 44}" width="14" height="18" fill="#FFE9A8" opacity=".5"/>`).join("");
      return `<rect x="${x}" y="${800 - bh}" width="80" height="${bh}" fill="${i % 2 ? "#134650" : "#0F3A44"}"/>${wins}`;
    });
    return `<circle cx="140" cy="260" r="58" fill="#FFD9C2"/>${bars.join("")}`;
  }
  // café table
  return `<rect y="560" width="600" height="240" fill="#B07C54" opacity=".9"/>
<rect y="540" width="600" height="30" fill="#8B5E3C"/>
<path d="M200 430 h200 l-24 130 h-152Z" fill="#fff"/>
<path d="M400 450 c60 0 60 70 0 70" stroke="#fff" stroke-width="16" fill="none"/>
<path d="M240 430 h120 l-6 24 h-108Z" fill="${c2}"/>
<path d="M260 390 c-18 -30 18 -40 0 -76 M300 390 c-18 -30 18 -40 0 -76 M340 390 c-18 -30 18 -40 0 -76" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>
<circle cx="110" cy="190" r="14" fill="${c1}"/><circle cx="500" cy="150" r="22" fill="${c1}" opacity=".6"/>`;
}

/**
 * variant 0 → portrait; 1..n → lifestyle scenes (mountains, city, café).
 */
export function portraitArt(seed: string, variant = 0): string {
  const h = hashString(seed);
  const [c1, c2] = BG[(h + variant) % BG.length];
  const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/>`;
  if (variant === 0) {
    return svgUri(`${grad}<circle cx="110" cy="130" r="90" fill="#fff" opacity=".35"/><circle cx="520" cy="300" r="140" fill="#fff" opacity=".25"/>${person(h)}`);
  }
  const k = (h + variant) % 3;
  const skyTop = k === 1 ? "#F7B79F" : c1;
  const sky = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/>`;
  return svgUri(`${sky}${scene(k, c1, c2, h)}`);
}

export const photoSet = (seed: string, count = 3) => Array.from({ length: count }, (_, i) => portraitArt(seed, i));

/** Fake credential image for the verification queue (ID badge style). */
export function credentialArt(label: string, name: string, seed: string): string {
  const h = hashString(seed);
  const color = SHIRT[h % 8];
  const safe = (s: string) => s.replace(/[<&>]/g, "");
  return svgUri(
    `<rect width="640" height="420" rx="26" fill="#F4EEE6"/>
<rect x="30" y="30" width="580" height="360" rx="22" fill="#fff" stroke="#E9E0D3" stroke-width="3"/>
<rect x="30" y="30" width="580" height="84" rx="22" fill="${color}"/><rect x="30" y="80" width="580" height="34" fill="${color}"/>
<text x="62" y="86" font-family="Arial" font-weight="700" font-size="30" fill="#fff">${safe(label)}</text>
<circle cx="150" cy="240" r="62" fill="#E9E0D3"/><circle cx="150" cy="222" r="26" fill="#C9BBA6"/><path d="M98 290 C110 252 190 252 202 290Z" fill="#C9BBA6"/>
<text x="260" y="210" font-family="Arial" font-weight="700" font-size="30" fill="#263238">${safe(name)}</text>
<rect x="260" y="230" width="280" height="12" rx="6" fill="#E9E0D3"/><rect x="260" y="256" width="210" height="12" rx="6" fill="#E9E0D3"/>
<rect x="260" y="296" width="150" height="40" rx="6" fill="none" stroke="#263238" stroke-width="2" stroke-dasharray="3 5"/>
<text x="268" y="324" font-family="Courier New" font-size="22" fill="#55616B">SAMPLE ${String(h % 100000).padStart(5, "0")}</text>
<text x="62" y="372" font-family="Arial" font-size="15" fill="#7A8691">Placeholder image · prototype only</text>`,
    640,
    420
  );
}

/** Simple chat-screenshot style evidence image used in report / consult mocks. */
export function screenshotArt(seed: string): string {
  const h = hashString(seed);
  const bubbles = [0, 1, 2, 3, 4].map((i) => {
    const mine = (h >> i) % 2 === 0;
    const w = 150 + ((h >> (i + 2)) % 5) * 28;
    return `<rect x="${mine ? 380 - w : 40}" y="${50 + i * 66}" width="${w}" height="46" rx="22" fill="${mine ? "#1B6A74" : "#E9E0D3"}"/>`;
  });
  return svgUri(`<rect width="420" height="420" fill="#FBF8F4"/>${bubbles.join("")}<text x="40" y="402" font-family="Arial" font-size="13" fill="#7A8691">Mock screenshot</text>`, 420, 420);
}
