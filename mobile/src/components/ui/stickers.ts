// Aussie sticker artwork from the v6 design, as inner SVG markup on a 64×64 viewBox

function star(cx: number, cy: number, r: number): string {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return `<path d="${d}Z" fill="#fff"/>`;
}

export const STICKERS = {
  koala:
    '<circle cx="13" cy="18" r="12" fill="#8E96A8"/><circle cx="13" cy="18" r="6" fill="#F3C9D6"/><circle cx="51" cy="18" r="12" fill="#8E96A8"/><circle cx="51" cy="18" r="6" fill="#F3C9D6"/><ellipse cx="32" cy="36" rx="21" ry="20" fill="#A7AFBF"/><ellipse cx="32" cy="46" rx="12" ry="8" fill="#E8EBF1"/><ellipse cx="32" cy="39" rx="6.5" ry="8.5" fill="#2B2D3A"/><ellipse cx="30" cy="35.5" rx="1.8" ry="2.4" fill="#5A5E70"/><circle cx="22" cy="31" r="2.8" fill="#14142B"/><circle cx="42" cy="31" r="2.8" fill="#14142B"/><circle cx="23" cy="30" r="1" fill="#fff"/><circle cx="43" cy="30" r="1" fill="#fff"/><ellipse cx="18" cy="40" rx="3.5" ry="2" fill="#F3A5BE" opacity=".8"/><ellipse cx="46" cy="40" rx="3.5" ry="2" fill="#F3A5BE" opacity=".8"/>',
  roo: '<rect x="13" y="13" width="38" height="38" rx="5" transform="rotate(45 32 32)" fill="#F4C430" stroke="#14142B" stroke-width="3"/><path d="M20 43c4 0 7-2 9-5 2-3 3-6 6-7l1-6 2 0 0 5c3 0 5 2 5 4-2 1-4 0-5 1 0 3-1 5-3 7l3 3h-3l-3-2c-3 1-6 1-9 0-3 1-6 1-9 0z" fill="#14142B"/><path d="M21 43c-3 1-6 1-8 0" stroke="#14142B" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
  sun: '<g stroke="#FFB020" stroke-width="4" stroke-linecap="round"><path d="M32 3v8M32 53v8M3 32h8M53 32h8M11.5 11.5l5.5 5.5M47 47l5.5 5.5M11.5 52.5l5.5-5.5M47 17l5.5-5.5"/></g><circle cx="32" cy="32" r="17" fill="#FFD23F"/><rect x="18" y="26" width="12" height="8" rx="4" fill="#14142B"/><rect x="34" y="26" width="12" height="8" rx="4" fill="#14142B"/><path d="M30 29h4" stroke="#14142B" stroke-width="2.4"/><path d="M25 40q7 5 14 0" stroke="#14142B" stroke-width="2.6" fill="none" stroke-linecap="round"/><rect x="20" y="27" width="3" height="2" rx="1" fill="#fff" opacity=".7"/>',
  pie: '<ellipse cx="32" cy="44" rx="25" ry="11" fill="#B06A22"/><path d="M7 42q25 -26 50 0z" fill="#E3A54A"/><g fill="#C98434"><circle cx="11" cy="41" r="3"/><circle cx="18" cy="35" r="3"/><circle cx="26" cy="31" r="3"/><circle cx="34" cy="30" r="3"/><circle cx="42" cy="32" r="3"/><circle cx="49" cy="36" r="3"/><circle cx="54" cy="41" r="3"/></g><path d="M23 30q9-9 18 0q3 6-4 6q-1 6-5 1q-5 3-7-2q-4-1-2-5z" fill="#D7263D"/><ellipse cx="29" cy="30" rx="3" ry="1.4" fill="#fff" opacity=".45"/>',
  cross:
    '<rect x="4" y="4" width="56" height="56" rx="14" fill="#1E2A6B"/>' +
    star(32, 14, 6.5) +
    star(20, 31, 5.5) +
    star(45, 28, 5.5) +
    star(32, 49, 7) +
    star(39, 38, 3),
  thongs:
    '<g transform="rotate(-14 22 34)"><ellipse cx="22" cy="34" rx="10" ry="22" fill="#FF6B4A" stroke="#14142B" stroke-width="2.5"/><path d="M22 20l-7 14M22 20l7 14" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="20" r="2.5" fill="#fff"/></g><g transform="rotate(12 44 32)"><ellipse cx="44" cy="32" rx="10" ry="22" fill="#2E5AA8" stroke="#14142B" stroke-width="2.5"/><path d="M44 18l-7 14M44 18l7 14" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="18" r="2.5" fill="#fff"/></g>',
  surf: '<g transform="rotate(-35 32 32)"><ellipse cx="32" cy="32" rx="10" ry="29" fill="#FFE7C2" stroke="#14142B" stroke-width="2.5"/><path d="M32 4v56" stroke="#FF6B4A" stroke-width="3.5"/><path d="M24 20q8 3 16 0M24 44q8 3 16 0" stroke="#2E5AA8" stroke-width="3" fill="none"/><path d="M32 54l-5 8h10z" fill="#14142B"/></g>',
} as const;

export type StickerName = keyof typeof STICKERS;

/** The artwork in solid white, for the die-cut border drawn behind each sticker */
export function silhouette(markup: string): string {
  return markup
    .replace(/fill="#[0-9A-Fa-f]+"/g, 'fill="#fff"')
    .replace(/stroke="#[0-9A-Fa-f]+"/g, 'stroke="#fff"')
    .replace(/ opacity="[^"]*"/g, "");
}

export function svgDoc(markup: string): string {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${markup}</svg>`;
}
