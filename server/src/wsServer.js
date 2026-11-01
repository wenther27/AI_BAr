import { WebSocketServer, WebSocket } from 'ws';

export class WsServerManager {
  constructor(port = 8080, onClientMessageCallback) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
    this.onClientMessage = onClientMessageCallback || (() => {});
  }

  start() {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws);
      const ip = req.socket.remoteAddress;
      console.log(`[WebSocket] Client mới kết nối (${ip}) - Tổng: ${this.clients.size}`);

      // Gửi tin nhắn chào mừng
      ws.send(JSON.stringify({
        type: 'init',
        data: {
          message: 'Đã kết nối thành công tới Quán Bar 3D Realtime Server',
          time: Date.now()
        }
      }));

      ws.on('message', (messageRaw) => {
        try {
          const parsed = JSON.parse(messageRaw.toString());
          this.onClientMessage(parsed, ws);
        } catch (err) {
          console.error('[WebSocket] Lỗi parse message client:', err.message);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client ngắt kết nối - Còn: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.warn('[WebSocket Client Error]:', err.message);
        this.clients.delete(ws);
      });
    });

    console.log(`[WebSocket] Server đang lắng nghe trên cổng ws://localhost:${this.port}`);
  }

  // Phát tin nhắn tới tất cả client đang mở (cảnh 3D và Admin Panel)
  broadcast(data) {
    if (!this.wss) return;
    const payload = JSON.stringify(data);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close() {
    if (this.wss) {
      this.wss.close();
    }
  }
}
