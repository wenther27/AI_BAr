import { WebcastPushConnection } from 'tiktok-live-connector';

export class TikTokService {
  constructor(onEventCallback) {
    this.tiktokLiveConnection = null;
    this.currentUsername = null;
    this.isConnected = false;
    this.onEvent = onEventCallback || (() => {});
    this.reconnectTimer = null;
    this.shouldAutoReconnect = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  async connect(username) {
    if (!username) {
      throw new Error('Vui lòng cung cấp @username TikTok của Host.');
    }

    const cleanUsername = username.replace(/^@/, '').trim();

    // Nếu đang kết nối đến cùng username thì giữ nguyên
    if (this.isConnected && this.currentUsername === cleanUsername) {
      return { success: true, message: 'Đang kết nối tới host này rồi.' };
    }

    // Nếu đang có kết nối khác, ngắt trước
    this.disconnect(false);

    this.currentUsername = cleanUsername;
    this.shouldAutoReconnect = true;

    try {
      this.tiktokLiveConnection = new WebcastPushConnection(cleanUsername, {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
        clientParams: {
          app_language: 'vi-VN',
          webcast_language: 'vi-VN'
        }
      });

      this._setupEventHandlers();

      const state = await this.tiktokLiveConnection.connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log(`[TikTok] Kết nối thành công tới phòng LIVE của @${cleanUsername} (RoomId: ${state.roomId})`);

      this.onEvent({
        type: 'status',
        data: {
          connected: true,
          username: cleanUsername,
          roomId: state.roomId,
          message: `Đã kết nối thành công tới LIVE @${cleanUsername}`
        }
      });

      return { success: true, roomId: state.roomId, username: cleanUsername };
    } catch (err) {
      this.isConnected = false;
      console.error(`[TikTok] Lỗi kết nối tới @${cleanUsername}:`, err.message);

      this.onEvent({
        type: 'status',
        data: {
          connected: false,
          username: cleanUsername,
          error: err.message
        }
      });

      throw err;
    }
  }

  disconnect(resetUsername = true) {
    this.shouldAutoReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.tiktokLiveConnection) {
      try {
        this.tiktokLiveConnection.disconnect();
      } catch (e) {
        // bỏ qua lỗi ngắt kết nối
      }
      this.tiktokLiveConnection = null;
    }

    this.isConnected = false;
    if (resetUsername) {
      this.currentUsername = null;
    }

    this.onEvent({
      type: 'status',
      data: {
        connected: false,
        username: this.currentUsername,
        message: 'Đã ngắt kết nối khỏi TikTok LIVE.'
      }
    });

    console.log('[TikTok] Đã ngắt kết nối.');
  }

  getStatus() {
    return {
      connected: this.isConnected,
      username: this.currentUsername,
      reconnecting: !!this.reconnectTimer
    };
  }

  _setupEventHandlers() {
    const conn = this.tiktokLiveConnection;
    if (!conn) return;

    // 1. Sự kiện có người vào xem (Member join)
    conn.on('member', (data) => {
      this.onEvent({
        type: 'member',
        timestamp: Date.now(),
        data: {
          userId: data.userId,
          uniqueId: data.uniqueId,
          nickname: data.nickname || data.uniqueId,
          profilePictureUrl: data.profilePictureUrl
        }
      });
    });

    // 2. Sự kiện bình luận (Chat comment)
    conn.on('chat', (data) => {
      this.onEvent({
        type: 'chat',
        timestamp: Date.now(),
        data: {
          userId: data.userId,
          uniqueId: data.uniqueId,
          nickname: data.nickname || data.uniqueId,
          profilePictureUrl: data.profilePictureUrl,
          comment: data.comment
        }
      });
    });

    // 3. Sự kiện tặng quà (Gift)
    conn.on('gift', (data) => {
      // Chỉ kích hoạt hiệu ứng khi kết thúc chuỗi quà (streak ended) hoặc quà không phải streak
      // repeatEnd = true là khi kết thúc combo quà tặng liên tiếp
      const isStreakFinished = data.repeatEnd === true || !data.gift?.combo;
      const diamondCount = data.diamondCount || 1;
      const repeatCount = data.repeatCount || 1;
      const totalDiamonds = diamondCount * repeatCount;

      this.onEvent({
        type: 'gift',
        timestamp: Date.now(),
        data: {
          userId: data.userId,
          uniqueId: data.uniqueId,
          nickname: data.nickname || data.uniqueId,
          profilePictureUrl: data.profilePictureUrl,
          giftId: data.giftId,
          giftName: data.giftName,
          diamondCount: diamondCount,
          repeatCount: repeatCount,
          totalDiamonds: totalDiamonds,
          repeatEnd: isStreakFinished,
          giftPictureUrl: data.giftPictureUrl
        }
      });
    });

    // 4. Sự kiện thả tim (Like)
    conn.on('like', (data) => {
      this.onEvent({
        type: 'like',
        timestamp: Date.now(),
        data: {
          userId: data.userId,
          uniqueId: data.uniqueId,
          nickname: data.nickname || data.uniqueId,
          profilePictureUrl: data.profilePictureUrl,
          likeCount: data.likeCount || 1,
          totalLikes: data.totalLikeCount || 0
        }
      });
    });

    // 5. Sự kiện tương tác MXH (Follow / Share)
    conn.on('social', (data) => {
      this.onEvent({
        type: 'social',
        timestamp: Date.now(),
        data: {
          userId: data.userId,
          uniqueId: data.uniqueId,
          nickname: data.nickname || data.uniqueId,
          profilePictureUrl: data.profilePictureUrl,
          action: data.displayType // 'pm_mt_guidance_share' hoặc 'follow'
        }
      });
    });

    // 6. Số lượng người đang xem hiện tại (Room User Count)
    conn.on('roomUser', (data) => {
      this.onEvent({
        type: 'roomUser',
        timestamp: Date.now(),
        data: {
          viewerCount: data.viewerCount || 0
        }
      });
    });

    // 7. Livestream kết thúc
    conn.on('streamEnd', () => {
      console.log('[TikTok] Phiên livestream đã kết thúc.');
      this.onEvent({
        type: 'streamEnd',
        timestamp: Date.now(),
        data: {
          message: 'Livestream đã kết thúc.'
        }
      });
    });

    // 8. Xử lý rớt mạng & tự động kết nối lại
    conn.on('disconnected', () => {
      console.warn('[TikTok] Mất kết nối từ TikTok Live.');
      this.isConnected = false;
      this._attemptReconnect();
    });

    conn.on('error', (err) => {
      console.error('[TikTok Error]:', err.message);
    });
  }

  _attemptReconnect() {
    if (!this.shouldAutoReconnect || !this.currentUsername) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[TikTok] Đã đạt tối đa số lần thử kết nối lại. Dừng lại.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(5000 * this.reconnectAttempts, 30000); // 5s, 10s, 15s... max 30s
    console.log(`[TikTok] Sẽ thử kết nối lại sau ${delay / 1000}s (Lần ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect(this.currentUsername);
      } catch (err) {
        console.warn('[TikTok] Kết nối lại thất bại:', err.message);
      }
    }, delay);
  }
}
