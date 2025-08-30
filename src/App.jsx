
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
  const [showPopup, setShowPopup] = useState(false);
  const gridRef = useRef();

  useEffect(() => {
    fetch('tkb.json')
      .then((res) => res.json())
      .then((data) => setTkb(data.data));
  }, []);

  // Gán ngẫu nhiên tiết và ngày cho mỗi môn học (demo)
  const tkbWithSlot = tkb.map((item, idx) => ({
    ...item,
    day: days[randomInt(0, days.length - 1)],
    period: periods[randomInt(1, periods.length - 1)]
  }));

  // Tạo ma trận thời khóa biểu
  const grid = {};
  days.forEach(day => {
    grid[day] = {};
    periods.forEach(period => {
      grid[day][period] = null;
    });
  });
  tkbWithSlot.forEach(item => {
    grid[item.day][item.period] = item;
  });

  // Hàm tải ảnh
  const handleDownloadImage = async () => {
    if (!gridRef.current) return;
    const canvas = await html2canvas(gridRef.current, { backgroundColor: null, useCORS: true });
    const link = document.createElement('a');
    link.download = 'tkb.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ fontFamily: 'Arial', background: '#f7f7f7', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', margin: '24px 0' }}>Thời khóa biểu</h2>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <button onClick={() => setShowPopup(true)} style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #eee' }}>
          Xem thời khóa biểu
        </button>
      </div>
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
        </div>
        {/* Grid thời khóa biểu */}
        <div style={{ flex: 1, overflowX: 'auto', padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #e0e0e0', border: '1px solid #e0e0e0' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 15 }}>
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
                    return (
                      <td key={day} style={{ border: '1px solid #e0e0e0', padding: 0, height: 70, verticalAlign: 'top', background: '#fff' }}>
                        {cell ? (
                          <div style={{ background: getSubjectColor(cell.mhp), margin: 6, borderRadius: 12, padding: '10px 12px', color: '#222', fontSize: 15, fontWeight: 500, boxShadow: '0 2px 8px #ccc', border: '2px solid #fff', transition: 'box-shadow 0.2s', lineHeight: 1.5 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{cell.ten}</div>
                            <div style={{ fontSize: 14 }}>Mã HP: <b>{cell.mhp}</b></div>
                            <div style={{ fontSize: 14 }}>Nhóm: <b>{cell.nhom}</b></div>
                            <div style={{ fontSize: 13, color: '#444' }}>ID tổ học: {cell.id_to_hoc}</div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup full màn hình */}
      {showPopup && (
        <div style={{ position: 'fixed', zIndex: 9999, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '95vw', height: '95vh', background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px #bbb', padding: 32, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={() => setShowPopup(false)} style={{ position: 'absolute', top: 24, right: 32, padding: '6px 18px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Đóng</button>
            <div style={{ width: '100%', overflow: 'auto', flex: 1 }}>
              <div ref={gridRef} style={{ minWidth: 900, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #e0e0e0', border: '1px solid #e0e0e0', padding: 24 }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: 15 }}>
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
                          return (
                            <td key={day} style={{ border: '1px solid #e0e0e0', padding: 0, height: 70, verticalAlign: 'top', background: '#fff' }}>
                              {cell ? (
                                <div style={{ background: getSubjectColor(cell.mhp), margin: 6, borderRadius: 12, padding: '10px 12px', color: '#222', fontSize: 15, fontWeight: 500, boxShadow: '0 2px 8px #ccc', border: '2px solid #fff', transition: 'box-shadow 0.2s', lineHeight: 1.5 }}>
                                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{cell.ten}</div>
                                  <div style={{ fontSize: 14 }}>Mã HP: <b>{cell.mhp}</b></div>
                                  <div style={{ fontSize: 14 }}>Nhóm: <b>{cell.nhom}</b></div>
                                  <div style={{ fontSize: 13, color: '#444' }}>ID tổ học: {cell.id_to_hoc}</div>
                                </div>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button onClick={handleDownloadImage} style={{ marginTop: 24, padding: '10px 28px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #eee' }}>
              Tải ảnh thời khóa biểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
