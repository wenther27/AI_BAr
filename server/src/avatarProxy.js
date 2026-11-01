import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '../cache/avatars');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Tạo SVG avatar mặc định cho người dùng khi ảnh lỗi hoặc không có URL
function getDefaultAvatarSvg(seed = 'TikTok') {
  const colors = ['#FF2D55', '#4E54C8', '#00F2FE', '#F39C12', '#2ECC71', '#9B59B6'];
  const color = colors[Math.abs(hashString(seed)) % colors.length];
  const initial = (seed && seed[0]) ? seed[0].toUpperCase() : '★';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <radialGradient id="grad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
      </radialGradient>
    </defs>
    <circle cx="64" cy="64" r="60" fill="${color}" stroke="#ffffff" stroke-width="4"/>
    <circle cx="64" cy="64" r="60" fill="url(#grad)"/>
    <text x="64" y="78" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Xử lý proxy và cache avatar người xem TikTok để Three.js load không dính CORS
 */
export async function handleAvatarProxy(req, res) {
  const targetUrl = req.query.url;
  const username = req.query.username || 'User';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache trình duyệt 1 ngày

  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(getDefaultAvatarSvg(username));
  }

  const hash = crypto.createHash('sha256').update(targetUrl).digest('hex');
  const cacheFilePath = path.join(CACHE_DIR, `${hash}.bin`);
  const metaFilePath = path.join(CACHE_DIR, `${hash}.meta`);

  // Kiểm tra file cache sẵn có
  if (fs.existsSync(cacheFilePath) && fs.existsSync(metaFilePath)) {
    try {
      const contentType = fs.readFileSync(metaFilePath, 'utf8');
      res.setHeader('Content-Type', contentType || 'image/jpeg');
      return res.sendFile(cacheFilePath);
    } catch (err) {
      console.warn('Lỗi đọc cache avatar:', err.message);
    }
  }

  // Tải từ TikTok CDN và lưu cache
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Fetch status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    fs.writeFileSync(cacheFilePath, buffer);
    fs.writeFileSync(metaFilePath, contentType);

    res.setHeader('Content-Type', contentType);
    return res.send(buffer);
  } catch (error) {
    // Khi TikTok CDN chặn hoặc URL hết hạn, trả về avatar dự phòng SVG đẹp mắt
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(getDefaultAvatarSvg(username));
  }
}
