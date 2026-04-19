const crypto = require("crypto");

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const captchaStore = new Map();

const randomInt = (min, max) => crypto.randomInt(min, max + 1);

const escapeSvgText = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const purgeExpiredCaptchas = () => {
  const now = Date.now();
  for (const [captchaId, entry] of captchaStore.entries()) {
    if (entry.expiresAt <= now) {
      captchaStore.delete(captchaId);
    }
  }
};

const buildCaptchaSvg = (text) => {
  const safeText = escapeSvgText(text);
  const noise = Array.from({ length: 6 }, (_, index) => {
    const x1 = randomInt(10, 190);
    const y1 = randomInt(10, 70);
    const x2 = randomInt(10, 190);
    const y2 = randomInt(10, 70);
    const stroke = index % 2 === 0 ? "#6f4e37" : "#47626f";
    const opacity = index % 2 === 0 ? "0.35" : "0.22";
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" opacity="${opacity}" />`;
  }).join("");

  const dots = Array.from({ length: 10 }, () => {
    const cx = randomInt(8, 192);
    const cy = randomInt(8, 72);
    const radius = randomInt(1, 3);
    const fill = Math.random() > 0.5 ? "#553722" : "#47626f";
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" opacity="0.18" />`;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80" role="img" aria-label="Login captcha">
      <rect x="0" y="0" width="200" height="80" rx="18" fill="#faf9f8" />
      <rect x="2" y="2" width="196" height="76" rx="16" fill="none" stroke="#82746d" stroke-opacity="0.35" />
      ${noise}
      ${dots}
      <text x="100" y="50" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="28" font-weight="800" fill="#553722" letter-spacing="4">
        ${safeText}
      </text>
    </svg>
  `.trim();
};

const createCaptchaCode = () => {
  const a = randomInt(1, 9);
  const b = randomInt(1, 9);
  return {
    prompt: `${a} + ${b}`,
    answer: String(a + b),
  };
};

const issueLoginCaptcha = () => {
  purgeExpiredCaptchas();

  const captchaId = crypto.randomUUID();
  const challenge = createCaptchaCode();
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;

  captchaStore.set(captchaId, {
    answer: challenge.answer,
    expiresAt,
  });

  return {
    captchaId,
    captchaSvg: buildCaptchaSvg(challenge.prompt),
    expiresInSeconds: Math.floor(CAPTCHA_TTL_MS / 1000),
  };
};

const verifyLoginCaptcha = (captchaId, captchaAnswer) => {
  purgeExpiredCaptchas();

  if (!captchaId || !captchaAnswer) {
    return false;
  }

  const entry = captchaStore.get(String(captchaId));
  captchaStore.delete(String(captchaId));

  if (!entry || entry.expiresAt <= Date.now()) {
    return false;
  }

  return entry.answer === String(captchaAnswer).trim();
};

module.exports = {
  issueLoginCaptcha,
  verifyLoginCaptcha,
};
