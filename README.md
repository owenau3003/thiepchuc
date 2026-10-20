## 🚀 HƯỚNG DẪN SỬ DỤNG NHANH

### Cách 1: Chạy trực tiếp trên máy tính
- Chỉ cần **click đúp chuột vào file `index.html`** để mở và trải nghiệm ngay trên trình duyệt (Chrome, Cốc Cốc, Edge, Safari...).

---

## 🎨 HƯỚNG DẪN TÙY CHỈNH THEO Ý BẠN

### 1. Thay đổi lời chúc và thông tin người nhận
Mở file `js/config.js` bằng Notepad hoặc VS Code:
- `introText`: Câu chúc mở đầu khi hoa nở (ví dụ: *"Happy 20/10 - Gửi tặng Lan nè 🌻✨"*).
- `flowerColor`: Theme màu sắc của bó hoa và thiệp thư (Mặc định là `"da_quy"` - Hoa Dã Quỳ vàng rực rỡ; hoặc bạn có thể đổi thành: `"classic"`, `"pink_mix"`, `"peach"`, `"pastel"`, `"purple"`, `"white"`, `"mix"`...).
- `letterTitle`: Tiêu đề bức thư trong phong bì.
- `letterContent`: Toàn bộ nội dung lời chúc, tâm tình bên trong bức thư (bạn có thể viết bao nhiêu dòng tùy thích).
- `letterSignature`: Chữ ký người gửi dưới đáy thư.

### 2. Thay đổi 6 bức ảnh kỷ niệm
- Vào thư mục `assets/img/`.
- Chuẩn bị 6 bức ảnh (ảnh dọc tỷ lệ 9:16 nhìn sẽ đẹp nhất).
- Đổi tên 6 ảnh thành:
  - `demo_1.jpg`
  - `demo_2.jpg`
  - `demo_3.jpg`
  - `demo_4.jpg`
  - `demo_5.jpg`
  - `demo_6.jpg`
  rồi chép đè vào thư mục `assets/img/`.

*(Để sửa lời nhắn riêng gắn với từng bức ảnh: Mở file `js/super_fx.js` tìm đến phần `PHOTO_STORIES` ở dòng 60 để sửa tiêu đề & lời nhắn của từng ảnh).*

### 3. Thay đổi nhạc nền
- Thư mục `assets/musics/` đã có sẵn 2 bài hát: `danhchoem.mp3` và `henngaymaiyeu.mp3`.
- Để chọn bài hát mặc định: Mở `js/config.js` dòng cuối cùng sửa `musicPath: "./assets/musics/danhchoem.mp3"`.
- Bạn cũng có thể chép bài hát MP3 yêu thích của bạn vào thư mục này và đổi tên đường dẫn tương ứng.

---

## 🌐 CÁCH ĐƯA LÊN MẠNG ĐỂ GỬI LINK CHO BẠN BÈ (MIỄN PHÍ 100%)

### Cách 1: Sử dụng GitHub Pages (Khuyên dùng)
1. Tạo 1 repository mới trên GitHub (chọn Public).
2. Tải toàn bộ các file trong thư mục này lên repository.
3. Vào **Settings** > **Pages** > tại mục **Branch** chọn **main** (hoặc master) rồi bấm **Save**.
4. Sau 1 phút, GitHub sẽ cấp cho bạn một đường link web miễn phí để gửi tặng bạn bè!

### Cách 2: Kéo thả lên Vercel / Netlify
1. Truy cập [app.netlify.com/drop](https://app.netlify.com/drop) hoặc [vercel.com](https://vercel.com).
2. Kéo thả nguyên thư mục này vào trang web.
3. Nhận ngay link web trực tiếp để gửi tặng người thương!

---
Chúc bạn và người thương có một ngày 20/10 thật hạnh phúc và ý nghĩa! 🌷💖
