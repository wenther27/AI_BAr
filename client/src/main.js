import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { ClubEnvironment } from './scene/ClubEnvironment.js';
import { LightingShow } from './scene/LightingShow.js';
import { AudioManager } from './scene/AudioManager.js';
import { CharacterManager } from './character/CharacterManager.js';
import { ParticleEffects } from './stage/ParticleEffects.js';
import { StageManager } from './stage/StageManager.js';
import { OverlayUI } from './ui/OverlayUI.js';
import { WsClient } from './network/wsClient.js';
import './ui/style.css';

class BarApplication {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.appContainer = document.getElementById('app-container');

    this.sceneManager = null;
    this.environment = null;
    this.lightingShow = null;
    this.audioManager = null;
    this.characterManager = null;
    this.particleEffects = null;
    this.stageManager = null;
    this.overlayUI = null;
    this.wsClient = null;

    this.clock = new THREE.Clock();
    this.isAudioStarted = false;
  }

  async init() {
    // 1. Tải cấu hình từ server
    let config = { bar: { name: '🔥 QUÁN BAR ONLINE VIP 🔥', aspectRatio: '16:9' } };
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        config = await res.json();
      }
    } catch (e) {
      console.warn('Dùng cấu hình mặc định');
    }

    // 2. Khởi tạo Three.js Scene
    this.sceneManager = new SceneManager(this.canvasContainer, {
      aspectRatio: config.bar.aspectRatio || '16:9'
    });

    // 3. Khởi tạo Club Environment (Sàn nhảy, sân khấu, màn LED, mirror ball)
    this.environment = new ClubEnvironment(this.sceneManager.scene);

    // 4. Khởi tạo Giàn đèn & Lasers
    this.lightingShow = new LightingShow(this.sceneManager.scene);

    // 5. Khởi tạo Web Audio Manager & Beat Synth
    this.audioManager = new AudioManager();

    // 6. Khởi tạo Particle Effects (Confetti, Hearts, Fireworks)
    this.particleEffects = new ParticleEffects(this.sceneManager.scene);

    // 7. Khởi tạo Quản lý Nhân vật Chibi
    this.characterManager = new CharacterManager(
      this.sceneManager.scene,
      config.bar.maxCharacters || 80
    );

    // 8. Khởi tạo Stage Manager & Gift Queue
    this.stageManager = new StageManager(
      this.sceneManager.scene,
      this.characterManager,
      this.particleEffects,
      config
    );

    // 9. Khởi tạo UI Overlay
    this.overlayUI = new OverlayUI(this.appContainer, {
      barName: config.bar.name
    });

    // Liên kết callback giữa Stage và UI
    this.stageManager.onGiftBannerTrigger = (giftData) => {
      this.overlayUI.showGiftBanner(giftData);
      this.lightingShow.triggerStrobe(1.5);
    };

    // Tắt tính năng zoom khi lên sân khấu theo yêu cầu - Giữ góc máy quay bao quát toàn cảnh ổn định
    this.stageManager.onDancerStageTrigger = null;

    this.stageManager.onLedTakeoverTrigger = (userData) => {
      this.environment.triggerSuperTakeover(userData);
    };

    this.overlayUI.onToggleAudio(() => {
      if (!this.isAudioStarted) {
        this.audioManager.start();
        this.isAudioStarted = true;
        return false;
      }
      return this.audioManager.toggleMute();
    });

    this.overlayUI.onNextTrack(() => {
      if (!this.isAudioStarted) {
        this.audioManager.start();
        this.isAudioStarted = true;
      } else {
        this.audioManager.nextTrack();
      }
    });

    this.audioManager.onTrackChangeCallback = (genre) => {
      this.overlayUI.updateMusicTrack(genre.name);
    };

    // 10. Kết nối WebSocket tới Backend
    this._initWebSocket();

    // 11. Bắt đầu Render Loop
    this._startRenderLoop();

    // 12. Lắng nghe phím tắt Test tiện lợi cho Host
    this._setupHostHotkeys();

    console.log('Quán Bar Online đã sẵn sàng!');
  }

  _initWebSocket() {
    this.wsClient = new WsClient();

    // Sự kiện có người vào xem livestream
    this.wsClient.on('member', (data) => {
      const char = this.characterManager.getOrCreate(data);
      this.overlayUI.addEventFeed(`👋 ${data.nickname} vừa vào sàn nhảy`, 'normal');
    });

    // Sự kiện bình luận chat
    this.wsClient.on('chat', (data) => {
      const char = this.characterManager.getOrCreate(data);
      if (char) {
        char.showChatBubble(data.comment);
      }
      this.overlayUI.addEventFeed(`💬 ${data.nickname}: ${data.comment}`, 'normal');
    });

    // Sự kiện tặng quà
    this.wsClient.on('gift', (data) => {
      this.stageManager.handleGift({ data });
      this.overlayUI.addEventFeed(`🎁 ${data.nickname} tặng ${data.giftName} x${data.repeatCount}`, 'gift');
    });

    // Sự kiện thả tim (Like)
    this.wsClient.on('like', (data) => {
      const char = this.characterManager.getOrCreate(data);
      if (char) {
        this.particleEffects.spawnHeart(char.group.position, Math.min(6, data.likeCount || 2));
      }
      this.overlayUI.addEventFeed(`❤️ ${data.nickname} đã thả tim!`, 'like');
    });

    // Cập nhật số người xem
    this.wsClient.on('roomUser', (data) => {
      this.overlayUI.updateViewerCount(data.viewerCount);
    });

    // Lệnh dọn sàn
    this.wsClient.on('clear_floor', () => {
      this.characterManager.clearFloor();
      this.overlayUI.addEventFeed('🧹 Đã làm mới sàn nhảy!', 'normal');
    });

    // Lệnh đổi tỉ lệ khung hình (16:9 hoặc 9:16)
    this.wsClient.on('change_aspect', (data) => {
      if (data && data.ratio) {
        this.sceneManager.setAspectRatio(data.ratio);
      }
    });

    // Lệnh đổi thể loại nhạc từ Admin
    this.wsClient.on('change_music', (data) => {
      if (data && data.genre) {
        if (!this.isAudioStarted) {
          this.audioManager.start();
          this.isAudioStarted = true;
        }
        this.audioManager.setGenre(data.genre);
      }
    });

    this.wsClient.connect();
  }

  _setupHostHotkeys() {
    // Cho phép Host bấm phím 1,2,3,4,5,6 để test ngay lập tức mà không cần mở admin
    window.addEventListener('keydown', (e) => {
      // Nhấn Space để bật nhạc
      if (e.code === 'Space') {
        if (!this.isAudioStarted) {
          this.audioManager.start();
          this.isAudioStarted = true;
        } else {
          this.audioManager.toggleMute();
        }
        return;
      }

      // Nhấn M để đổi thể loại nhạc tiếp theo
      if (e.key === 'm' || e.key === 'M') {
        if (!this.isAudioStarted) {
          this.audioManager.start();
          this.isAudioStarted = true;
        } else {
          this.audioManager.nextTrack();
        }
        return;
      }

      if (e.key === '1') {
        fetch('/api/mock/member', { method: 'POST' });
      } else if (e.key === '2') {
        fetch('/api/mock/gift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'small' })
        });
      } else if (e.key === '3') {
        fetch('/api/mock/gift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'medium' })
        });
      } else if (e.key === '4') {
        fetch('/api/mock/gift', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'super' })
        });
      } else if (e.key === '5') {
        fetch('/api/mock/chat', { method: 'POST' });
      } else if (e.key === '6') {
        fetch('/api/mock/like', { method: 'POST' });
      }
    });

    // Khởi động AudioContext khi người dùng click lần đầu vào trang (theo chính sách Autoplay của trình duyệt)
    window.addEventListener('click', () => {
      if (!this.isAudioStarted) {
        this.audioManager.start();
        this.isAudioStarted = true;
      }
    }, { once: true });
  }

  _startRenderLoop() {
    const loop = () => {
      requestAnimationFrame(loop);

      const delta = Math.min(this.clock.getDelta(), 0.1);

      // 1. Phân tích tần số âm thanh từ Web Audio
      const audioData = this.audioManager.update();

      // 2. Cập nhật Môi trường Quán Bar & Màn hình LED
      this.environment.update(delta, audioData);

      // 3. Cập nhật Giàn đèn Moving Head & Lasers chớp theo beat
      this.lightingShow.update(delta, audioData);

      // 4. Cập nhật Nhân vật Chibi (Procedural dance & steering)
      this.characterManager.update(delta, audioData.energy);

      // 5. Cập nhật Sân khấu & Hàng đợi
      this.stageManager.update(delta);

      // 6. Cập nhật Hạt Particle (Confetti, Hearts, Fireworks)
      this.particleEffects.update(delta);

      // 7. Cập nhật Camera và Render Scene
      this.sceneManager.update(delta);
      this.sceneManager.render();

      // 8. Cập nhật hàng đợi hiển thị trên UI
      this.overlayUI.updateUpcomingQueue(this.stageManager.getUpcomingDancers());
    };

    loop();
  }
}

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
  const app = new BarApplication();
  app.init();
});
