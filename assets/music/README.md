# HƯỚNG DẪN ÂM NHẠC CHO QUÁN BAR LIVESTREAM

## 1. Lưu ý quan trọng về bản quyền âm nhạc trên TikTok LIVE
- Khi livestream trên TikTok LIVE, nền tảng này kiểm duyệt bản quyền âm nhạc rất gắt gao. Sử dụng nhạc có bản quyền thương mại (như các bài hit V-Pop, US-UK) có thể dẫn tới việc:
  - Bị tắt âm thanh livestream (Mute audio stream).
  - Bị giới hạn phân phối lượt xem (Flop live).
  - Nặng nhất là bị khóa tính năng LIVE tạm thời hoặc vĩnh viễn.

## 2. Giải pháp âm nhạc tích hợp sẵn
- Ứng dụng đã được tích hợp sẵn một **Bộ tổng hợp âm thanh EDM Procedural (Web Audio Synth)**:
  - Tự động sinh tiếng Kick 4/4, Rolling Bassline, Hi-hat, Synth Stabs theo nhịp 126 BPM chuẩn phong cách Club.
  - **100% không bản quyền (Royalty-free)**, an toàn tuyệt đối khi phát live 24/7.
  - Không cần tải bất kỳ file MP3 nào.

## 3. Cách thêm nhạc MP3 của riêng bạn
Nếu bạn muốn phát danh sách bài nhạc MP3 do bạn tự sản xuất hoặc nhạc NoCopyrightSounds (NCS):
1. Copy các file `.mp3` vào thư mục `assets/music/` này (ví dụ: `track1.mp3`, `track2.mp3`).
2. Khai báo danh sách bài hát trong file `config.json` ở thư mục gốc:
```json
"audio": {
  "defaultVolume": 0.6,
  "enableProceduralBeat": false,
  "playlist": [
    "/assets/music/track1.mp3",
    "/assets/music/track2.mp3"
  ]
}
```
