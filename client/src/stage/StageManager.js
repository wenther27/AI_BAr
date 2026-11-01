import * as THREE from 'three';
import { GiftQueue } from './GiftQueue.js';
import { CHARACTER_STATE } from '../character/Character.js';

export class StageManager {
  constructor(scene, characterManager, particleEffects, config = {}) {
    this.scene = scene;
    this.characterManager = characterManager;
    this.particleEffects = particleEffects;
    this.config = config;

    this.giftQueue = new GiftQueue(config);

    // 3 vị trí trên sân khấu (Sân khấu cao Y = 1.35)
    this.slots = [
      { id: 0, name: 'left', position: new THREE.Vector3(-3.2, 1.35, -7.5), occupant: null },
      { id: 1, name: 'center', position: new THREE.Vector3(0, 1.35, -7.0), occupant: null },
      { id: 2, name: 'right', position: new THREE.Vector3(3.2, 1.35, -7.5), occupant: null }
    ];

    this.onGiftBannerTrigger = null; // callback (giftData) => {}
    this.onLedTakeoverTrigger = null; // callback (userData) => {}
    this.onDancerStageTrigger = null; // callback (slotPos, item) => {}
  }

  /**
   * Xử lý event tặng quà nhận từ TikTok hoặc Mock
   */
  handleGift(giftEvent) {
    const queueItem = this.giftQueue.enqueue(giftEvent);

    // Kích hoạt banner quà trên UI
    if (this.onGiftBannerTrigger) {
      this.onGiftBannerTrigger(giftEvent.data);
    }

    // Đảm bảo nhân vật có trên sàn
    this.characterManager.getOrCreate(giftEvent.data);

    // Thử đưa người lên sân khấu ngay nếu có slot trống
    this._dispatchNextDancers();
  }

  _dispatchNextDancers() {
    if (this.giftQueue.isEmpty()) return;

    // Tìm slot trống
    const availableSlots = this.slots.filter(s => s.occupant === null);
    if (availableSlots.length === 0) return; // Sân khấu đang kín chỗ

    const nextItem = this.giftQueue.peek();
    if (!nextItem) return;

    // Ưu tiên vị trí: Nếu quà to/super thì lấy Center (Slot 1) nếu trống
    let targetSlot = null;
    if (nextItem.tier === 'super' || nextItem.tier === 'large') {
      const centerSlot = this.slots[1];
      if (centerSlot.occupant === null) {
        targetSlot = centerSlot;
      }
    }

    // Nếu không có slot center hoặc quà thường, lấy slot trống đầu tiên
    if (!targetSlot) {
      targetSlot = availableSlots[0];
    }

    // Lấy item khỏi hàng đợi
    const item = this.giftQueue.dequeue();
    const char = this.characterManager.getOrCreate(item.userData);

    targetSlot.occupant = char;

    // Đưa nhân vật lên sân khấu
    char.sendToStage(
      targetSlot.id,
      targetSlot.position,
      item.duration,
      item.danceSpeed
    );

    // Kích hoạt Zoom máy quay cận cảnh sân khấu và chiếu tên trên màn hình LED
    if (this.onDancerStageTrigger) {
      this.onDancerStageTrigger(targetSlot.position, item);
    }

    // Bắn hiệu ứng pháo giấy confetti
    const isGold = item.tier === 'super';
    this.particleEffects.spawnConfetti(targetSlot.position, item.tier === 'super' ? 180 : 100, isGold);

    // Nếu quà lớn hoặc super -> bắn thêm pháo hoa
    if (item.tier === 'large' || item.tier === 'super') {
      this.particleEffects.spawnFireworks(targetSlot.position);
    }

    // Nếu Super VIP -> takeover màn hình LED
    if (item.tier === 'super' && this.onLedTakeoverTrigger) {
      this.onLedTakeoverTrigger(item.userData);
    }
  }

  update(delta) {
    // Kiểm tra xem ai đã hết giờ nhảy trên sân khấu để giải phóng slot
    for (const slot of this.slots) {
      if (slot.occupant) {
        if (slot.occupant.state === CHARACTER_STATE.FLOOR_IDLE || 
            slot.occupant.state === CHARACTER_STATE.RETURNING_TO_FLOOR) {
          slot.occupant = null;
        }
      }
    }

    // Tiếp tục đưa người từ queue lên nếu còn slot
    this._dispatchNextDancers();
  }

  getUpcomingDancers() {
    return this.giftQueue.getUpcomingList(4);
  }
}
