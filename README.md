# 🍸 QUÁN BAR ONLINE 3D - TIKTOK LIVE INTERACTIVE METAVERSE

Phần mềm mô phỏng vũ trường 3D tương tác thời gian thực dành riêng cho **TikTok LIVE**, biến phòng live của bạn thành một bữa tiệc âm nhạc và ánh sáng ảo sống động. Người xem vào phòng sẽ xuất hiện thành nhân vật Chibi 3D trên sàn nhảy với avatar TikTok thật, tặng quà sẽ được đưa lên sân khấu biểu diễn solo với hiệu ứng hoành tráng!

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Kết nối TikTok LIVE thời gian thực**:
   - Sử dụng `tiktok-live-connector` bắt chuẩn xác các sự kiện: `member` (vào phòng), `chat` (bình luận), `gift` (tặng quà & chuỗi streak), `like` (thả tim), `follow`, `share`, `roomUser` (số người xem).
   - Tự động kết nối lại (Auto Reconnect) khi mạng chập chờn.

2. **Cảnh 3D Quán Bar Đẳng Cấp (Three.js)**:
   - Sàn nhảy phản chiếu bóng loáng (Glossy / Reflective Floor).
   - Sân khấu nâng cao với bàn DJ, hệ thống giàn khung truss kim loại.
   - Màn hình LED khổng lồ phía sau sân khấu chạy chữ và visualizer sóng âm theo nhạc, tự động takeover toàn màn hình khi có Siêu Đại Gia.
   - Quả cầu gương Disco (Mirror ball) xoay đều trên trần nhà.
   - Giàn đèn Moving Head xoay quét chùm tia sáng volumic, dàn tia Laser đa màu và Strobe nháy theo nhịp nhạc.

3. **Nhân Vật Người Xem Phong Cách Chibi**:
   - Tỉ lệ Chibi dễ thương (đầu to, thân nhỏ).
   - Khuôn mặt là Texture Avatar TikTok của người xem thật (được tải qua proxy cache của server chống lỗi CORS).
   - Thân áo có màu sắc đẹp mắt được tạo theo mã băm (`hash`) của User ID.
   - Nameplate phía trên đầu hiển thị avatar thu nhỏ + tên người xem (hỗ trợ tiếng Việt có dấu và emoji).
   - Hiệu ứng rơi từ trên trời xuống sàn khi mới vào phòng.
   - Di chuyển mượt mà trên sàn và sử dụng thuật toán phân bố khoảng cách (Separation steering) tránh đè lên nhau.
   - Bong bóng chat nổi trên đầu trong 4 giây khi người dùng bình luận.
   - Hiệu ứng tim 3D bay lên khi người dùng bấm thả tim like.
   - Quản lý tối đa 80 nhân vật trên sàn (tự động dọn dẹp người không hoạt động lâu nhất).

4. **Sân Khấu & Phân Hạng Quà Tặng**:
   - Sân khấu có 3 vị trí (Trái, Giữa, Phải).
   - Hàng đợi ưu tiên (Priority Queue) theo tổng giá trị kim cương (`totalDiamonds`).
   - Xử lý chuỗi quà (Streak): Tự động cộng dồn thời gian và nâng cấp bậc nếu tiếp tục tặng quà.
   - Cấp bậc quà tặng (`config.json`):
     - **Quà nhỏ (1–9 💎)**: Nhảy 15 giây, điệu cơ bản, đèn spotlight.
     - **Quà vừa (10–99 💎)**: Nhảy 30 giây, điệu sôi động, bắn pháo giấy Confetti.
     - **Quà lớn (100–999 💎)**: Nhảy 45 giây, vị trí trung tâm, pháo hoa rực rỡ và tia laser.
     - **Siêu đại gia (≥ 1000 💎)**: Nhảy 60 giây solo tại vị trí Center, toàn màn hình LED hiển thị Avatar và Tên chúc mừng, hiệu ứng pháo hoa hoàng gia.
   - 5 điệu nhảy Procedural mượt mà (Wiggle, Bounce Jump, Wave Hands, Spin Twist, Groove Hip-hop) với tính năng chuyển điệu (crossfade) êm ái.

5. **Âm Thanh Web Audio & Đèn Nháy Theo Nhạc**:
   - Tích hợp bộ tạo beat EDM Procedural Synth tự động (Kick 4/4, Rolling Bass, Hi-hat, Synth chord) **100% không lo dính gậy bản quyền âm nhạc TikTok**.
   - Phân tích tần số âm thanh theo thời gian thực (Bass, Mid, Treble) kích hoạt đèn Moving Head và Laser chớp nẩy theo từng nhịp bass.
   - Hỗ trợ nạp file MP3 tùy chọn.

6. **UI & Bảng Điều Khiển Host (Admin Panel)**:
   - Tỉ lệ khung hình linh hoạt: **16:9** (Ngang cho OBS) hoặc **9:16** (Dọc cho TikTok LIVE Studio).
   - Bảng xếp hạng Top 5 Đại Gia cập nhật realtime.
   - Banner quà tặng xuất hiện giữa màn hình.
   - Event Feed góc phải thông báo hoạt động.
   - Trang Host Admin (`/admin.html`) mở ở tab riêng trên điện thoại/máy tính phụ: Nhập username kết nối LIVE thật, hoặc kích hoạt các nút thử nghiệm Demo (Member, Chat, Like, Gift, Auto-bot).

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY

### 1. Cài đặt các gói phụ thuộc
Mở một cửa sổ Terminal/PowerShell tại thư mục `D:\AI_BAr` và chạy:

```bash
# Cài đặt server
cd server
npm install

# Cài đặt client
cd ../client
npm install
```

### 2. Khởi chạy ứng dụng

**Chạy Server Backend:**
```bash
cd D:\AI_BAr\server
npm run dev
```
*(Server chạy tại `http://localhost:3000` và WebSocket tại `ws://localhost:8080`)*

**Chạy Client Frontend (Cảnh 3D & Admin):**
Mở thêm một cửa sổ Terminal mới:
```bash
cd D:\AI_BAr\client
npm run dev
```
*(Client chạy tại `http://localhost:5173`)*

---

## 📺 CÁCH ĐƯA VÀO OBS STUDIO HOẶC TIKTOK LIVE STUDIO

### 1. Trong OBS Studio:
1. Mở OBS $\rightarrow$ Trong ô **Sources** bấm dấu `+` $\rightarrow$ Chọn **Browser**.
2. Đặt URL là: `http://localhost:5173`.
3. Nhập độ phân giải:
   - Livestream màn hình ngang: **Width: 1920**, **Height: 1080**.
   - Livestream màn hình dọc: **Width: 1080**, **Height: 1920**.
4. Tích chọn **Control audio via OBS** (nếu muốn điều khiển âm lượng từ OBS).

### 2. Trong TikTok LIVE Studio:
1. Bấm **Add Source** $\rightarrow$ Chọn **Link / Web / Browser**.
2. Nhập URL: `http://localhost:5173`.
3. Chọn kích thước nguồn hình phù hợp với bố cục stream của bạn.

---

## 🎛️ CÁCH SỬ DỤNG VÀ TEST THỬ NGHIỆM

### Cách 1: Điều khiển qua Trang Admin (`/admin.html`)
Mở trình duyệt truy cập:
👉 **`http://localhost:5173/admin.html`**

- **Kết nối TikTok thật**: Nhập `@username` của kênh đang phát LIVE $\rightarrow$ bấm **Kết nối LIVE**.
- **Chế độ Demo Mock**: Bấm các nút để kích hoạt ngay:
  - *Người vào sàn*
  - *Người xem chat*
  - *Thả tim*
  - *Tặng quà nhỏ (1💎) / vừa (50💎) / siêu VIP (1200💎)*
  - *Auto-Mock Bot*: Bật để bot tự động tạo sự kiện liên tục như một phòng live thật có hàng trăm người xem!
- **Đổi tỉ lệ**: Bấm nút **Tỉ lệ 16:9** hoặc **Tỉ lệ 9:16** để căn chỉnh camera tức thì.

### Cách 2: Phím tắt bàn phím trực tiếp trên màn hình 3D
Khi đang mở màn hình cảnh 3D (`http://localhost:5173`), bạn có thể dùng các phím tắt nhanh:
- **Phím Space**: Bật / Tắt tiếng nhạc
- **Phím 1**: Giả lập 1 người xem mới vào phòng
- **Phím 2**: Giả lập tặng Quà Nhỏ (1 💎)
- **Phím 3**: Giả lập tặng Quà Vừa (50 💎)
- **Phím 4**: Giả lập tặng Quà Siêu VIP (1200 💎)
- **Phím 5**: Giả lập người xem bình luận chat
- **Phím 6**: Giả lập thả tim (Like)

---

## ⚙️ CẤU HÌNH HỆ THỐNG (`config.json`)

Bạn có thể chỉnh sửa file `config.json` ở thư mục gốc để thay đổi:
- `bar.name`: Đổi tên hiển thị của quán bar.
- `bar.maxCharacters`: Giới hạn số lượng nhân vật trên sàn (mặc định 80).
- `giftTiers`: Điều chỉnh ngưỡng kim cương (`minDiamonds`, `maxDiamonds`), thời gian nhảy trên sân khấu (`duration`), tốc độ nhảy (`danceSpeed`) và hiệu ứng đi kèm.

---

## 🚧 HẠN CHẾ & ĐỀ XUẤT CẢI TIẾN TIẾP THEO

1. **Thay thế Animation bằng Mixamo 3D (Skeletal Animation)**:
   - *Hiện tại*: Đang sử dụng 5 điệu nhảy Procedural thủ tục (xoay khớp, nhún gối, vẫy tay) rất mượt và nhẹ.
   - *Đề xuất*: Bạn có thể tải các file animation nhảy GLB/FBX từ [Mixamo](https://www.mixamo.com/) (như Gangnam Style, Hip-Hop, Macarena) và nạp vào qua `THREE.GLTFLoader` để nhân vật nhảy các bài hot trend TikTok.
2. **Hiệu ứng vật lý (Physics/Cannon.js)**:
   - Thêm tương tác va chạm vật lý nảy bật khi đám đông chen nhau lên sân khấu.
3. **Mini-game tương tác quà tặng**:
   - Đấu trường PK giữa 2 phe tặng quà: Bên nào tặng nhiều hơn thì nhân vật phe đó chiếm toàn bộ sàn nhảy hoặc đẩy phe kia xuống bể bơi ảo.
