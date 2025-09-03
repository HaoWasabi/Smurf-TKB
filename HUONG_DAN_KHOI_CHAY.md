# Hướng Dẫn Khởi Chạy Dự Án Smurf-TKB

## Giới Thiệu
Smurf-TKB là ứng dụng quản lý thời khóa biểu dành cho sinh viên, hỗ trợ nhập/xuất dữ liệu JSON và hiển thị lịch học trực quan.

## Yêu Cầu Hệ Thống
- Node.js phiên bản 18.0 trở lên
- npm hoặc yarn
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)

## Cài Đặt Dự Án

### 1. Tải Mã Nguồn
```bash
# Clone repository từ GitHub
git clone https://github.com/HaoWasabi/Smurf-TKB.git

# Hoặc tải ZIP từ v0 và giải nén
```

### 2. Di Chuyển Vào Thư Mục Dự Án
```bash
cd Smurf-TKB
```

### 3. Cài Đặt Dependencies
```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install
```

## Khởi Chạy Ứng Dụng

### 1. Chế Độ Development (Phát Triển)
```bash
# Sử dụng npm
npm run dev

# Hoặc sử dụng yarn
yarn dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 2. Chế Độ Production (Sản Xuất)
```bash
# Build ứng dụng
npm run build

# Khởi chạy
npm start
```

## Cách Sử Dụng

### 1. Nhập Dữ Liệu
- **Kéo thả file JSON**: Kéo file JSON vào vùng upload
- **Chọn file**: Click vào nút "Chọn File JSON" để browse file
- **Định dạng hỗ trợ**: 
  - Định dạng phẳng (flat): Mỗi môn học là một object riêng
  - Định dạng nhóm (grouped): Môn học có mảng lịch học

### 2. Xem Thời Khóa Biểu
- Lịch học hiển thị theo lưới 7 ngày x 10 tiết
- Màu sắc khác nhau cho từng môn học
- Hiển thị thông tin: Tên môn, giảng viên, phòng học

### 3. Xuất Dữ Liệu
- **JSON Nhóm**: Xuất theo định dạng có cấu trúc lồng
- **JSON Phẳng**: Xuất theo định dạng phẳng
- **CSV**: Xuất dạng bảng tính
- **Hình ảnh PNG**: Chụp màn hình thời khóa biểu
- **In**: In trực tiếp thời khóa biểu

## Cấu Trúc File JSON

### Định Dạng Đầu Vào (Flat Format)
```json
[
  {
    "ten": "Tên môn học",
    "mhp": "Mã học phần",
    "nhom": "Nhóm",
    "thu": 2,
    "so_tiet": 3,
    "tiet": 1,
    "giang_vien": "Tên giảng viên",
    "phong": "Phòng học"
  }
]
```

### Định Dạng Đầu Ra (Grouped Format)
```json
[
  {
    "ten": "Tên môn học",
    "mhp": "Mã học phần", 
    "nhom": "Nhóm",
    "lich": [
      {
        "thu": 2,
        "tiet": 1,
        "so_tiet": 3,
        "giang_vien": "Tên giảng viên",
        "phong": "Phòng học"
      }
    ]
  }
]
```

## Xử Lý Sự Cố

### Lỗi Cài Đặt
```bash
# Xóa node_modules và cài đặt lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi Port Đã Được Sử Dụng
```bash
# Thay đổi port (ví dụ: 3001)
npm run dev -- -p 3001
```

### Lỗi File JSON
- Kiểm tra định dạng JSON hợp lệ
- Đảm bảo có đủ các trường bắt buộc
- Kiểm tra encoding UTF-8 cho tiếng Việt

## Triển Khai

### Vercel (Khuyến nghị)
1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Deploy tự động

### Render
1. Kết nối GitHub repository
2. Cấu hình build command: `npm run build`
3. Cấu hình start command: `npm start`

## Hỗ Trợ
- GitHub Issues: [https://github.com/HaoWasabi/Smurf-TKB/issues](https://github.com/HaoWasabi/Smurf-TKB/issues)
- Email: [Thông tin liên hệ của bạn]

## Phiên Bản
- v2.0.0: Cải thiện giao diện, thêm tính năng xuất/nhập JSON nâng cao
- v1.0.0: Phiên bản cơ bản
