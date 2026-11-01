import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleAvatarProxy } from './avatarProxy.js';
import { TikTokService } from './tiktokService.js';
import { WsServerManager } from './wsServer.js';
import {
  createMockMember,
  createMockChat,
  createMockLike,
  createMockGift
} from './mockService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../');
const CONFIG_PATH = path.join(ROOT_DIR, 'config.json');

// Đọc file config
let appConfig = {
  server: { port: 3000, wsPort: 8080 },
  bar: { name: '🔥 QUÁN BAR ONLINE VIP 🔥', aspectRatio: '16:9', maxCharacters: 80 }
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    appConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.warn('Không thể đọc config.json, dùng config mặc định');
  }
}

const HTTP_PORT = process.env.PORT || appConfig.server.port || 3000;
const WS_PORT = process.env.WS_PORT || appConfig.server.wsPort || 8080;

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo WebSocket Manager
let wsManager;
let tiktokService;

// Phát sự kiện từ TikTok hoặc Mock tới client 3D
function handleBroadcastEvent(event) {
  if (wsManager) {
    wsManager.broadcast(event);
  }
}

tiktokService = new TikTokService(handleBroadcastEvent);

wsManager = new WsServerManager(WS_PORT, (message, ws) => {
  // Lắng nghe lệnh từ Client hoặc Admin Panel qua WebSocket
  if (message.type === 'admin_command') {
    handleAdminCommand(message.command, message.payload);
  }
});
wsManager.start();

function handleAdminCommand(command, payload = {}) {
  switch (command) {
    case 'mock_member':
      handleBroadcastEvent(createMockMember(payload.user));
      break;
    case 'mock_chat':
      handleBroadcastEvent(createMockChat(payload.user, payload.comment));
      break;
    case 'mock_like':
      handleBroadcastEvent(createMockLike(payload.user, payload.count || 10));
      break;
    case 'mock_gift':
      handleBroadcastEvent(createMockGift(payload.tier || 'random', payload.user));
      break;
    case 'clear_floor':
      handleBroadcastEvent({ type: 'clear_floor', timestamp: Date.now() });
      break;
    case 'change_aspect':
      handleBroadcastEvent({ type: 'change_aspect', ratio: payload.ratio || '16:9' });
      break;
    case 'change_music':
      handleBroadcastEvent({ type: 'change_music', genre: payload.genre });
      break;
    case 'change_light_preset':
      handleBroadcastEvent({ type: 'change_light_preset', preset: payload.preset });
      break;
    default:
      console.log('Lệnh admin không xác định:', command);
  }
}

// REST API Endpoints
// 1. Proxy và Cache Avatar người xem TikTok
app.get('/avatar', handleAvatarProxy);

// 2. Lấy cấu hình hệ thống
app.get('/api/config', (req, res) => {
  res.json(appConfig);
});

// 3. Cập nhật cấu hình
app.post('/api/config', (req, res) => {
  try {
    appConfig = { ...appConfig, ...req.body };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(appConfig, null, 2));
    wsManager.broadcast({ type: 'config_updated', data: appConfig });
    res.json({ success: true, config: appConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Kết nối tới TikTok LIVE của Host
app.post('/api/tiktok/connect', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Cần cung cấp username TikTok' });
  }

  try {
    const result = await tiktokService.connect(username);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Ngắt kết nối TikTok
app.post('/api/tiktok/disconnect', (req, res) => {
  tiktokService.disconnect();
  res.json({ success: true, message: 'Đã ngắt kết nối TikTok' });
});

// 6. Trạng thái kết nối
app.get('/api/tiktok/status', (req, res) => {
  res.json(tiktokService.getStatus());
});

// 7. REST Endpoint cho Admin trigger mock event
app.post('/api/mock/:type', (req, res) => {
  const { type } = req.params;
  const payload = req.body || {};

  switch (type) {
    case 'member':
      handleBroadcastEvent(createMockMember(payload.user));
      break;
    case 'chat':
      handleBroadcastEvent(createMockChat(payload.user, payload.comment));
      break;
    case 'like':
      handleBroadcastEvent(createMockLike(payload.user, payload.count));
      break;
    case 'gift':
      handleBroadcastEvent(createMockGift(payload.tier || 'random', payload.user));
      break;
    case 'clear':
      handleBroadcastEvent({ type: 'clear_floor', timestamp: Date.now() });
      break;
    default:
      return res.status(400).json({ error: 'Loại mock không hợp lệ' });
  }

  res.json({ success: true, event: type });
});

// Phục vụ thư mục static assets nếu có (nhạc, ảnh)
app.use('/assets', express.static(path.join(ROOT_DIR, 'assets')));

// Khởi chạy HTTP Server
app.listen(HTTP_PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 QUÁN BAR ONLINE BACKEND ĐÃ CHẠY THÀNH CÔNG!`);
  console.log(`👉 HTTP Server: http://localhost:${HTTP_PORT}`);
  console.log(`👉 WebSocket  : ws://localhost:${WS_PORT}`);
  console.log(`👉 Proxy Avatar: http://localhost:${HTTP_PORT}/avatar?url=...`);
  console.log(`====================================================`);
});
