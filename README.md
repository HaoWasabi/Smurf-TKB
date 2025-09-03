# Smurf-TKB - Quản Lý Thời Khóa Biểu

[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://smurf-tkb.onrender.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

Ứng dụng web quản lý thời khóa biểu dành cho sinh viên, hỗ trợ nhập/xuất dữ liệu JSON và hiển thị lịch học trực quan.

## Tính Năng

- **Hiển thị thời khóa biểu trực quan** - Lưới 7 ngày x 10 tiết với màu sắc phân biệt
- **Hỗ trợ đa nền tảng** - Sử dụng được trên nhiều thiết bị
- **Nhập dữ liệu linh hoạt** - Hỗ trợ kéo thả file JSON, tự động phát hiện định dạng
- **Xuất đa định dạng** - JSON (grouped/flat), CSV, PNG, và in trực tiếp
- **Giao diện thân thiện** - Thiết kế responsive, hỗ trợ tiếng Việt
- **Xử lý nhanh** - Validation dữ liệu thông minh, thống kê chi tiết

## Demo

Truy cập: [https://smurf-tkb1.onrender.com](https://smurf-tkb1.onrender.com)

## Yêu Cầu

- Node.js 18+
- npm hoặc yarn

## Cài Đặt

```bash
# Clone repository
git clone https://github.com/HaoWasabi/Smurf-TKB.git
cd Smurf-TKB

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Hướng Dẫn Chi Tiết

Xem file [HUONG_DAN_KHOI_CHAY.md](./HUONG_DAN_KHOI_CHAY.md) để có hướng dẫn đầy đủ bằng tiếng Việt.

## Công Nghệ

- **Framework**: Next.js 14 với App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Export**: html2canvas cho xuất hình ảnh

## Định Dạng Dữ Liệu

### Input (Flat Format)
```json
[
  {
    "ten": "Lập trình Web",
    "mhp": "IT4409",
    "nhom": "01",
    "thu": 2,
    "so_tiet": 3,
    "tiet": 1,
    "giang_vien": "Nguyễn Văn A",
    "phong": "TC-201"
  }
]
```

### Output (Grouped Format)
```json
[
  {
    "ten": "Lập trình Web",
    "mhp": "IT4409",
    "nhom": "01",
    "lich": [
      {
        "thu": 2,
        "tiet": 1,
        "so_tiet": 3,
        "giang_vien": "Nguyễn Văn A",
        "phong": "TC-201"
      }
    ]
  }
]
```

## Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Tác Giả

**HaoWasabi** - [GitHub](https://github.com/HaoWasabi)

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [html2canvas](https://html2canvas.hertzen.com/) - Screenshot library

## Tham khảo
- [TKB_SGU_Extension](https://github.com/huukhuong/TKB_SGU_Extension)
- [TKB-SGU-UI](https://github.com/nguyluky/TKB-SGU-UI)