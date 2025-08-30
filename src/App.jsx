
import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';

const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const periods = Array.from({ length: 10 }, (_, i) => i + 1); // 10 tiết

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Bảng màu cho các môn học
const subjectColors = [
  '#A5D6A7', // xanh lá
  '#90CAF9', // xanh dương
  '#FFF59D', // vàng
  '#F8BBD0', // hồng
  '#FFCC80', // cam
  '#CE93D8', // tím
  '#EF9A9A'  // đỏ nhạt
];

function getSubjectColor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return subjectColors[Math.abs(hash) % subjectColors.length];
}

function App() {
  const [tkb, setTkb] = useState([]);
  // Bỏ chức năng fullscreen popup
  const [showPreview, setShowPreview] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const gridRef = useRef();

  useEffect(() => {
    fetch('tkb.json')
      .then((res) => res.json())
      .then((data) => setTkb(data.data));
  }, []);

  // Tạo ma trận thời khóa biểu từ dữ liệu tkb
  // Mỗi item cần có: thu (ngày, số từ 2-8), tiet (số tiết bắt đầu), so_tiet (số tiết liên tiếp, mặc định 1)
  const grid = {};
  days.forEach(day => {
    grid[day] = {};
    periods.forEach(period => {
      grid[day][period] = null;
    });
  });
  tkb.forEach(item => {
    // Chỉ render nếu có trường thu và tiet
    if (item.thu && item.tiet) {
      const day = days[item.thu - 2]; // thu: 2->8 (Thứ 2->CN)
      const period = item.tiet;
      const so_tiet = item.so_tiet || 1;
      grid[day][period] = { ...item, so_tiet };
      // Đánh dấu các tiết tiếp theo là đã bị chiếm bởi rowspan
      for (let i = 1; i < so_tiet; i++) {
        if (grid[day][period + i] !== undefined) grid[day][period + i] = 'skip';
      }
    }
  });

  // Hàm xem trước ảnh
  const handlePreviewImage = async () => {
    // Đảm bảo ref trỏ đúng bảng chính
    const table = document.querySelector('#tkb-table');
    if (!table) return;
    const canvas = await html2canvas(table, { backgroundColor: null, useCORS: true });
    setPreviewImg(canvas.toDataURL('image/png'));
    setShowPreview(true);
  };

  // Hàm tải ảnh từ preview
  const handleDownloadImage = () => {
    if (!previewImg) return;
    const link = document.createElement('a');
    link.download = 'tkb.png';
    link.href = previewImg;
    link.click();
  };

  return (
    <div style={{ fontFamily: 'Arial', background: '#f7f7f7', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', margin: '24px 0' }}>Thời khóa biểu</h2>
      <div style={{ display: 'flex' }}>
        {/* Sidebar môn học */}
        <div style={{ width: 260, background: '#fff', borderRight: '1px solid #eee', padding: 16 }}>
          <h4 style={{ marginBottom: 12 }}>Danh sách môn học</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tkb.map(item => (
              <li key={item.mhp} style={{ marginBottom: 8, padding: 8, background: getSubjectColor(item.mhp), borderRadius: 6, color: '#222' }}>
                {item.ten}
              </li>
            ))}
          </ul>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {/* màu success */}
            <button onClick={handlePreviewImage} style={{ padding: '10px 28px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #eee' }}>
              Tải ảnh
            </button> 
          </div>
        </div>
        {/* Grid thời khóa biểu */}
        <div style={{ flex: 1, overflowX: 'auto', padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #e0e0e0', border: '1px solid #e0e0e0' }}>
          <table id="tkb-table" ref={gridRef} style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 15 }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #d0d0d0', padding: '12px 8px', background: '#f5f5f5', minWidth: 60, fontWeight: 600 }}>Tiết</th>
                {days.map(day => (
                  <th key={day} style={{ border: '1px solid #d0d0d0', padding: '12px 8px', background: '#f5f5f5', minWidth: 120, fontWeight: 600 }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td style={{ border: '1px solid #e0e0e0', padding: '12px 8px', background: '#fafafa', textAlign: 'center', fontWeight: 500 }}>{period}</td>
                  {days.map(day => {
                    const cell = grid[day][period];
                    if (cell === 'skip') return null;
                    if (cell) {
                      return (
                        <td key={day} rowSpan={cell.so_tiet} style={{ border: '1px solid #e0e0e0', padding: 0, height: 70 * cell.so_tiet, verticalAlign: 'top', background: '#fff' }}>
                          <div style={{ background: getSubjectColor(cell.mhp || ''), margin: 6, borderRadius: 12, padding: '10px 12px', color: '#222', fontSize: 15, fontWeight: 500, boxShadow: '0 2px 8px #ccc', border: '2px solid #fff', transition: 'box-shadow 0.2s', lineHeight: 1.5 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{cell.ten || ''}</div>
                            {cell.mhp && <div style={{ fontSize: 14 }}>Mã HP: <b>{cell.mhp}</b></div>}
                            {cell.nhom && <div style={{ fontSize: 14 }}>Nhóm: <b>{cell.nhom}</b></div>}
                            {cell.giang_vien && <div style={{ fontSize: 14 }}>GV: <b>{cell.giang_vien}</b></div>}
                            {cell.phong && <div style={{ fontSize: 14 }}>Phòng: <b>{cell.phong}</b></div>}
                          </div>
                        </td>
                      );
                    }
                    return <td key={day} style={{ border: '1px solid #e0e0e0', padding: 0, height: 70, background: '#fff' }}/>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Popup xem trước ảnh */}
      {showPreview && (
        <div style={{ position: 'fixed', zIndex: 10000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px #bbb', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: 18 }}>Xem trước ảnh thời khóa biểu</h3>
            {previewImg && <img src={previewImg} alt="tkb preview" style={{ maxWidth: '80vw', maxHeight: '60vh', borderRadius: 12, boxShadow: '0 2px 12px #ccc', marginBottom: 24 }} />}
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={handleDownloadImage} style={{ padding: '10px 28px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #eee' }}>
                Tiếp tục
              </button>
              <button onClick={() => setShowPreview(false)} style={{ padding: '10px 28px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #eee' }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
