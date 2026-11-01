import { WsClient } from './network/wsClient.js';

class AdminPanel {
  constructor() {
    this.wsClient = new WsClient();
    this.autoBotInterval = null;

    this.init();
  }

  init() {
    this.wsClient.connect();

    this.inputUsername = document.getElementById('input-username');
    this.btnConnect = document.getElementById('btn-connect');
    this.btnDisconnect = document.getElementById('btn-disconnect');
    this.connectStatus = document.getElementById('connect-status');

    this.btnMockMember = document.getElementById('btn-mock-member');
    this.btnMockChat = document.getElementById('btn-mock-chat');
    this.btnMockLike = document.getElementById('btn-mock-like');
    this.btnMockGiftSmall = document.getElementById('btn-mock-gift-small');
    this.btnMockGiftMed = document.getElementById('btn-mock-gift-med');
    this.btnMockGiftSuper = document.getElementById('btn-mock-gift-super');

    this.btnToggleAutoBot = document.getElementById('btn-toggle-autobot');
    this.autoBotStatus = document.getElementById('autobot-status');

    this.btnRatio169 = document.getElementById('btn-ratio-169');
    this.btnRatio916 = document.getElementById('btn-ratio-916');
    this.btnClearFloor = document.getElementById('btn-clear-floor');

    this._setupEventListeners();
    this._checkStatus();
  }

  _setupEventListeners() {
    // 1. TikTok Connect & Disconnect
    this.btnConnect.addEventListener('click', async () => {
      const username = this.inputUsername.value.trim();
      if (!username) {
        alert('Vui lòng nhập @username TikTok của Host!');
        return;
      }

      this._updateStatus('Đang kết nối tới TikTok LIVE...', 'loading');
      try {
        const res = await fetch('/api/tiktok/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (data.success) {
          this._updateStatus(`Đã kết nối LIVE: @${username}`, 'connected');
        } else {
          this._updateStatus(`Lỗi: ${data.error || 'Không thể kết nối'}`, 'disconnected');
        }
      } catch (err) {
        this._updateStatus(`Lỗi mạng: ${err.message}`, 'disconnected');
      }
    });

    this.btnDisconnect.addEventListener('click', async () => {
      await fetch('/api/tiktok/disconnect', { method: 'POST' });
      this._updateStatus('Đã ngắt kết nối', 'disconnected');
    });

    // 2. Mock Events Trigger
    this.btnMockMember.addEventListener('click', () => {
      fetch('/api/mock/member', { method: 'POST' });
    });

    this.btnMockChat.addEventListener('click', () => {
      fetch('/api/mock/chat', { method: 'POST' });
    });

    this.btnMockLike.addEventListener('click', () => {
      fetch('/api/mock/like', { method: 'POST' });
    });

    this.btnMockGiftSmall.addEventListener('click', () => {
      fetch('/api/mock/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'small' })
      });
    });

    this.btnMockGiftMed.addEventListener('click', () => {
      fetch('/api/mock/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'medium' })
      });
    });

    this.btnMockGiftSuper.addEventListener('click', () => {
      fetch('/api/mock/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'super' })
      });
    });

    // 3. Đổi Thể Loại Nhạc Sàn
    const genreButtons = document.querySelectorAll('.btn-genre');
    genreButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const genre = btn.getAttribute('data-genre');
        this.wsClient.send({
          type: 'admin_command',
          command: 'change_music',
          payload: { genre }
        });
        genreButtons.forEach(b => b.classList.remove('btn-danger'));
        btn.classList.add('btn-danger');
      });
    });

    // 4. Auto-Bot Demo Toggle
    this.btnToggleAutoBot.addEventListener('click', () => {
      this._toggleAutoBot();
    });

    // 4. Aspect Ratio & Clear Floor
    this.btnRatio169.addEventListener('click', () => {
      this.wsClient.send({
        type: 'admin_command',
        command: 'change_aspect',
        payload: { ratio: '16:9' }
      });
    });

    this.btnRatio916.addEventListener('click', () => {
      this.wsClient.send({
        type: 'admin_command',
        command: 'change_aspect',
        payload: { ratio: '9:16' }
      });
    });

    this.btnClearFloor.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn dọn sạch tất cả người xem trên sàn nhảy?')) {
        this.wsClient.send({
          type: 'admin_command',
          command: 'clear_floor'
        });
      }
    });
  }

  _toggleAutoBot() {
    if (this.autoBotInterval) {
      clearInterval(this.autoBotInterval);
      this.autoBotInterval = null;
      this.btnToggleAutoBot.textContent = '🤖 Bật Auto-Mock Bot Tự Động';
      this.btnToggleAutoBot.classList.remove('btn-danger');
      this.autoBotStatus.textContent = 'Đang tắt bot tự động';
    } else {
      this.btnToggleAutoBot.textContent = '⏹ Dừng Auto-Mock Bot';
      this.btnToggleAutoBot.classList.add('btn-danger');
      this.autoBotStatus.textContent = '⚡ Bot đang phát sinh tương tác liên tục...';

      this.autoBotInterval = setInterval(() => {
        const rand = Math.random();
        if (rand < 0.25) {
          fetch('/api/mock/member', { method: 'POST' });
        } else if (rand < 0.5) {
          fetch('/api/mock/chat', { method: 'POST' });
        } else if (rand < 0.75) {
          fetch('/api/mock/like', { method: 'POST' });
        } else if (rand < 0.9) {
          fetch('/api/mock/gift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier: 'small' })
          });
        } else {
          fetch('/api/mock/gift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier: Math.random() > 0.5 ? 'medium' : 'super' })
          });
        }
      }, 2000); // 2 giây phát sinh 1 hành động
    }
  }

  async _checkStatus() {
    try {
      const res = await fetch('/api/tiktok/status');
      if (res.ok) {
        const status = await res.json();
        if (status.connected) {
          this._updateStatus(`Đang kết nối tới LIVE: @${status.username}`, 'connected');
        }
      }
    } catch (e) {}
  }

  _updateStatus(text, state) {
    this.connectStatus.textContent = `● ${text}`;
    this.connectStatus.className = 'status-pill ' + (state === 'connected' ? 'status-connected' : 'status-disconnected');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
