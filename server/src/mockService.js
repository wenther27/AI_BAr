// Mock Service tạo dữ liệu giả lập TikTok LIVE để test không cần live thật

const SAMPLE_NAMES = [
  'Quang Hải ⚽', 'Linh Barbie 🌸', 'Sơn Tùng M-TP 🎤', 'Hương Giang ✨', 
  'Độ Mixi 🎮', 'Khánh Vy 🇬🇧', 'Trấn Thành 🎭', 'Cô Ba Sài Gòn ☕',
  'Binz Đan Cử 💎', 'Suboi 🧢', 'Khoa Pug ✈️', 'MisThy 🦊',
  'Cris Devil 😈', 'ViruSs 🎧', 'Hậu Hoàng 👑', '1977 Vlog 📽️'
];

const SAMPLE_CHATS = [
  'Nhạc cháy quá anh em ơi! 🔥🔥🔥',
  'Xin chào cả nhà!',
  'DJ đánh bài gì căng thế! 🔊',
  'Cho em xin một chân trên sàn nhảy!',
  'Đã thả 100 tim rồi nha idol ❤️❤️❤️',
  'Quán bar này VIP quá trời!',
  'Tí lên sân khấu solo không bạn ơi haha 💃',
  'Quẩy lên nào anh em ơi 🕺🕺🕺',
  'Âm thanh ánh sáng đỉnh thật sự!',
  'Nay quẩy tới sáng luôn nhé chủ quán ơi 🎉'
];

const SAMPLE_GIFTS = [
  { name: 'Hoa Hồng', diamonds: 1, repeat: 1 },
  { name: 'Thả Tim Tay', diamonds: 5, repeat: 1 },
  { name: 'Bánh Kem', diamonds: 10, repeat: 2 },
  { name: 'Nước Hoa VIP', diamonds: 50, repeat: 1 },
  { name: 'Kính Râm Cool', diamonds: 99, repeat: 1 },
  { name: 'Xe Thể Thao', diamonds: 299, repeat: 1 },
  { name: 'Máy Bay Trực Thăng', diamonds: 599, repeat: 1 },
  { name: 'Tên Lửa Siêu Cấp', diamonds: 1200, repeat: 1 },
  { name: 'Lâu Đài Hoàng Gia', diamonds: 3000, repeat: 1 }
];

// Danh sách ảnh mẫu từ nguồn miễn phí hoặc URL placeholder hoạt động tốt
const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
];

let mockUsersPool = [];

// Khởi tạo một nhóm người xem mẫu để có tương tác nhất quán
function initMockPool() {
  if (mockUsersPool.length > 0) return;
  mockUsersPool = SAMPLE_NAMES.map((name, index) => {
    return {
      userId: `mock_user_${index + 1}`,
      uniqueId: `user_tiktok_${index + 1}`,
      nickname: name,
      profilePictureUrl: SAMPLE_AVATARS[index % SAMPLE_AVATARS.length]
    };
  });
}

export function getRandomMockUser() {
  initMockPool();
  return mockUsersPool[Math.floor(Math.random() * mockUsersPool.length)];
}

export function createMockMember(customUser = null) {
  const user = customUser || getRandomMockUser();
  return {
    type: 'member',
    timestamp: Date.now(),
    data: {
      userId: user.userId,
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl
    }
  };
}

export function createMockChat(customUser = null, customMsg = null) {
  const user = customUser || getRandomMockUser();
  const comment = customMsg || SAMPLE_CHATS[Math.floor(Math.random() * SAMPLE_CHATS.length)];
  return {
    type: 'chat',
    timestamp: Date.now(),
    data: {
      userId: user.userId,
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      comment: comment
    }
  };
}

export function createMockLike(customUser = null, count = 5) {
  const user = customUser || getRandomMockUser();
  return {
    type: 'like',
    timestamp: Date.now(),
    data: {
      userId: user.userId,
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      likeCount: count,
      totalLikes: Math.floor(Math.random() * 500) + 100
    }
  };
}

export function createMockGift(tier = 'random', customUser = null) {
  const user = customUser || getRandomMockUser();
  let gift;

  if (tier === 'small') {
    gift = SAMPLE_GIFTS[Math.floor(Math.random() * 2)]; // 1 - 5 diamonds
  } else if (tier === 'medium') {
    gift = SAMPLE_GIFTS[2 + Math.floor(Math.random() * 3)]; // 10 - 99 diamonds
  } else if (tier === 'large') {
    gift = SAMPLE_GIFTS[5 + Math.floor(Math.random() * 2)]; // 299 - 599 diamonds
  } else if (tier === 'super') {
    gift = SAMPLE_GIFTS[7 + Math.floor(Math.random() * 2)]; // >= 1200 diamonds
  } else {
    gift = SAMPLE_GIFTS[Math.floor(Math.random() * SAMPLE_GIFTS.length)];
  }

  const repeatCount = gift.repeat || 1;
  const diamondCount = gift.diamonds;
  const totalDiamonds = diamondCount * repeatCount;

  return {
    type: 'gift',
    timestamp: Date.now(),
    data: {
      userId: user.userId,
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      giftId: Math.floor(Math.random() * 9000) + 1000,
      giftName: gift.name,
      diamondCount: diamondCount,
      repeatCount: repeatCount,
      totalDiamonds: totalDiamonds,
      repeatEnd: true
    }
  };
}
