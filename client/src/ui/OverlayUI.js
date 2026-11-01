/**
 * Quản lý giao diện hiển thị 2D Overlay (HUD) cho livestream
 */
export class OverlayUI {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.barName = options.barName || '🔥 QUÁN BAR ONLINE VIP 🔥';

    this.viewerCount = 0;
    this.totalGifts = 0;
    this.donorsMap = new Map(); // userId -> { nickname, profilePictureUrl, totalDiamonds }

    this.bannerTimeout = null;

    this._createDOM();
  }

  _createDOM() {
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'ui-overlay';

    this.overlayElement.innerHTML = `
      <!-- Top Header -->
      <div class="header-bar">
        <div class="bar-title-box">
          <div class="bar-title" id="ui-bar-name">${this.barName}</div>
        </div>
        <div class="stats-container">
          <div class="stat-pill live-viewers">
            <span class="icon">👥</span>
            <span id="ui-viewers-count">0 người xem</span>
          </div>
          <div class="stat-pill gifts-count">
            <span class="icon">💎</span>
            <span id="ui-total-gifts">0 kim cương</span>
          </div>
        </div>
      </div>

      <!-- Top Đại Gia (Top 5 Donors) -->
      <div class="leaderboard-container">
        <div class="leaderboard-title">
          <span>👑 TOP ĐẠI GIA</span>
        </div>
        <div class="donor-list" id="ui-donor-list">
          <div style="font-size: 11px; opacity: 0.6; text-align: center; padding: 6px;">
            Chưa có người tặng quà
          </div>
        </div>
      </div>

      <!-- Event Feed bên phải -->
      <div class="event-feed" id="ui-event-feed"></div>

      <!-- Banner Quà Tặng Lớn -->
      <div class="gift-banner-container" id="ui-gift-banner">
        <div class="gift-banner-card">
          <img src="" class="banner-avatar" id="ui-banner-avatar" alt="User">
          <div class="banner-info">
            <div class="banner-user" id="ui-banner-user">User Name</div>
            <div class="banner-gift-desc" id="ui-banner-gift">Tặng Hoa Hồng x1</div>
          </div>
        </div>
      </div>

      <!-- Gợi ý tương tác ở giữa dưới -->
      <div class="interaction-tip">
        🎁 Tặng Quà Để Lên Sân Khấu Nhảy Cực Cháy! 💃
      </div>

      <!-- Bottom Bar -->
      <div class="bottom-bar">
        <div class="queue-preview">
          <div class="queue-label">SẮP LÊN SÂN KHẤU:</div>
          <div class="queue-avatars" id="ui-queue-avatars">
            <span style="font-size: 11px; opacity: 0.5;">Trống</span>
          </div>
        </div>

        <div class="controls-cluster">
          <button class="clickable stat-pill" id="btn-music-track" title="Bấm để đổi bài nhạc tiếp theo (Phím M)" style="cursor: pointer; border-color: rgba(0, 242, 254, 0.4); background: rgba(10, 15, 30, 0.65);">
            <span class="icon">🎧</span>
            <span id="ui-current-track">🔥 Vinahouse Nonstop</span>
          </button>
          <button class="btn-icon clickable" id="btn-toggle-audio" title="Bật/Tắt Nhạc (Space)">🎵</button>
          <button class="btn-icon clickable" id="btn-toggle-fullscreen" title="Toàn màn hình">⛶</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.overlayElement);

    this.viewersCountEl = document.getElementById('ui-viewers-count');
    this.totalGiftsEl = document.getElementById('ui-total-gifts');
    this.donorListEl = document.getElementById('ui-donor-list');
    this.eventFeedEl = document.getElementById('ui-event-feed');
    this.giftBannerEl = document.getElementById('ui-gift-banner');
    this.bannerAvatarEl = document.getElementById('ui-banner-avatar');
    this.bannerUserEl = document.getElementById('ui-banner-user');
    this.bannerGiftEl = document.getElementById('ui-banner-gift');
    this.queueAvatarsEl = document.getElementById('ui-queue-avatars');

    this._setupControls();
  }

  _setupControls() {
    const fsBtn = document.getElementById('btn-toggle-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  onToggleAudio(callback) {
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = callback();
        audioBtn.textContent = isMuted ? '🔇' : '🎵';
      });
    }
  }

  updateViewerCount(count) {
    this.viewerCount = count;
    if (this.viewersCountEl) {
      this.viewersCountEl.textContent = `${count.toLocaleString()} người xem`;
    }
  }

  addEventFeed(text, type = 'normal') {
    if (!this.eventFeedEl) return;
    const item = document.createElement('div');
    item.className = `feed-item ${type}`;
    item.textContent = text;
    this.eventFeedEl.prepend(item);

    // Giữ tối đa 5 thông báo
    if (this.eventFeedEl.children.length > 5) {
      this.eventFeedEl.removeChild(this.eventFeedEl.lastChild);
    }

    // Tự động xóa sau 6 giây
    setTimeout(() => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    }, 6000);
  }

  showGiftBanner(giftData) {
    const { nickname, profilePictureUrl, giftName, repeatCount, totalDiamonds } = giftData;

    this.totalGifts += totalDiamonds;
    if (this.totalGiftsEl) {
      this.totalGiftsEl.textContent = `${this.totalGifts.toLocaleString()} kim cương`;
    }

    // Cập nhật bảng xếp hạng
    this._recordDonation(giftData);

    // Hiển thị banner giữa màn hình
    const avatarProxy = `/avatar?url=${encodeURIComponent(profilePictureUrl || '')}&username=${encodeURIComponent(nickname)}`;
    this.bannerAvatarEl.src = avatarProxy;
    this.bannerUserEl.textContent = nickname || 'Khách VIP';
    this.bannerGiftEl.textContent = `Tặng ${giftName} x${repeatCount} (${totalDiamonds} 💎)`;

    this.giftBannerEl.classList.add('active');

    if (this.bannerTimeout) {
      clearTimeout(this.bannerTimeout);
    }

    this.bannerTimeout = setTimeout(() => {
      this.giftBannerEl.classList.remove('active');
    }, 4500);
  }

  _recordDonation(giftData) {
    const { userId, nickname, profilePictureUrl, totalDiamonds } = giftData;
    const existing = this.donorsMap.get(userId) || {
      nickname,
      profilePictureUrl,
      totalDiamonds: 0
    };
    existing.totalDiamonds += totalDiamonds;
    this.donorsMap.set(userId, existing);

    this._renderLeaderboard();
  }

  _renderLeaderboard() {
    if (!this.donorListEl) return;
    const sorted = Array.from(this.donorsMap.values())
      .sort((a, b) => b.totalDiamonds - a.totalDiamonds)
      .slice(0, 5);

    if (sorted.length === 0) return;

    this.donorListEl.innerHTML = '';
    const medals = ['👑', '🥈', '🥉', '4', '5'];

    sorted.forEach((donor, idx) => {
      const item = document.createElement('div');
      item.className = 'donor-item';
      const avatarUrl = `/avatar?url=${encodeURIComponent(donor.profilePictureUrl || '')}&username=${encodeURIComponent(donor.nickname)}`;

      item.innerHTML = `
        <div class="donor-left">
          <span class="donor-rank rank-${idx + 1}">${medals[idx]}</span>
          <img src="${avatarUrl}" class="donor-avatar" alt="avatar">
          <span class="donor-name">${donor.nickname}</span>
        </div>
        <span class="donor-diamonds">${donor.totalDiamonds} 💎</span>
      `;
      this.donorListEl.appendChild(item);
    });
  }

  updateUpcomingQueue(upcomingList) {
    if (!this.queueAvatarsEl) return;
    if (upcomingList.length === 0) {
      this.queueAvatarsEl.innerHTML = '<span style="font-size: 11px; opacity: 0.5;">Trống</span>';
      return;
    }

    this.queueAvatarsEl.innerHTML = '';
    upcomingList.forEach((item) => {
      const img = document.createElement('img');
      img.className = 'queue-avatar-thumb';
      img.src = `/avatar?url=${encodeURIComponent(item.profilePictureUrl || '')}&username=${encodeURIComponent(item.nickname)}`;
      img.title = `${item.nickname} (${item.giftName} - ${item.totalDiamonds}💎)`;
      this.queueAvatarsEl.appendChild(img);
    });
  }

  updateMusicTrack(trackName) {
    const el = document.getElementById('ui-current-track');
    if (el) el.textContent = trackName;
  }

  onNextTrack(callback) {
    const btn = document.getElementById('btn-music-track');
    if (btn) {
      btn.addEventListener('click', callback);
    }
  }
}
