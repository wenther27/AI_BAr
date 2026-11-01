/**
 * WebSocket Client kết nối tới Backend Quán Bar
 */
export class WsClient {
  constructor(url = 'ws://localhost:8080') {
    this.url = url;
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[WS Client] Kết nối thành công tới Server:', this.url);
        this._emit('connection_change', { status: 'connected' });
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._emit(message.type, message.data || message);
          this._emit('*', message); // Lắng nghe toàn bộ
        } catch (err) {
          console.warn('[WS Client] Lỗi parse JSON:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.warn('[WS Client] Mất kết nối tới Server. Sẽ thử kết nối lại sau 3s...');
        this._emit('connection_change', { status: 'disconnected' });
        this._scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WS Client Error]:', err);
        if (this.ws) this.ws.close();
      };
    } catch (e) {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  off(eventType, callback) {
    if (!this.listeners.has(eventType)) return;
    const list = this.listeners.get(eventType).filter(cb => cb !== callback);
    this.listeners.set(eventType, list);
  }

  _emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      for (const cb of this.listeners.get(eventType)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Lỗi listener WS [${eventType}]:`, err);
        }
      }
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
