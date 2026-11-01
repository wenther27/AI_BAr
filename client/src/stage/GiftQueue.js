/**
 * Quản lý Hàng đợi tặng quà (Priority Queue theo kim cương & xử lý Streak)
 */
export class GiftQueue {
  constructor(config = {}) {
    this.queue = []; // Danh sách người đang đợi lên sân khấu
    this.giftTiers = config.giftTiers || {
      small: { minDiamonds: 1, duration: 15, danceSpeed: 1.1 },
      medium: { minDiamonds: 10, duration: 30, danceSpeed: 1.35 },
      large: { minDiamonds: 100, duration: 45, danceSpeed: 1.6 },
      super: { minDiamonds: 1000, duration: 60, danceSpeed: 2.0 }
    };
  }

  determineTier(totalDiamonds) {
    if (totalDiamonds >= 1000) return 'super';
    if (totalDiamonds >= 100) return 'large';
    if (totalDiamonds >= 10) return 'medium';
    return 'small';
  }

  getTierConfig(tierName) {
    return this.giftTiers[tierName] || this.giftTiers.small;
  }

  /**
   * Thêm một quà mới vào hàng đợi
   */
  enqueue(giftEvent) {
    const { userId, nickname, profilePictureUrl, totalDiamonds, giftName, repeatCount } = giftEvent.data;

    // Kiểm tra xem người này đã có trong hàng đợi chưa (quà streak hoặc gửi liên tiếp)
    const existingIndex = this.queue.findIndex(item => item.userId === userId);

    if (existingIndex !== -1) {
      // Cộng dồn điểm và thời gian
      const existing = this.queue[existingIndex];
      existing.totalDiamonds += totalDiamonds;
      existing.repeatCount += repeatCount;
      existing.giftName = giftName;
      existing.tier = this.determineTier(existing.totalDiamonds);
      const tierConf = this.getTierConfig(existing.tier);
      existing.duration = Math.min(120, existing.duration + tierConf.duration * 0.5); // max 2 phút

      // Sắp xếp lại hàng đợi theo thứ tự ưu tiên diamond
      this._sortQueue();
      return existing;
    }

    const tier = this.determineTier(totalDiamonds);
    const tierConf = this.getTierConfig(tier);

    const queueItem = {
      userId,
      nickname,
      profilePictureUrl,
      userData: giftEvent.data,
      totalDiamonds,
      repeatCount,
      giftName,
      tier,
      duration: tierConf.duration,
      danceSpeed: tierConf.danceSpeed,
      enqueuedAt: Date.now()
    };

    this.queue.push(queueItem);
    this._sortQueue();
    return queueItem;
  }

  _sortQueue() {
    // Sắp xếp: Ưu tiên người tặng nhiều diamond hơn, nếu bằng nhau thì ai vào trước lên trước
    this.queue.sort((a, b) => {
      if (b.totalDiamonds !== a.totalDiamonds) {
        return b.totalDiamonds - a.totalDiamonds;
      }
      return a.enqueuedAt - b.enqueuedAt;
    });
  }

  dequeue() {
    return this.queue.shift();
  }

  peek() {
    return this.queue[0] || null;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  getUpcomingList(limit = 4) {
    return this.queue.slice(0, limit);
  }

  size() {
    return this.queue.length;
  }
}
