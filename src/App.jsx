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
  const [subjects, setSubjects] = useState([]); // Danh sách môn học
  const [editSubject, setEditSubject] = useState(null); // Môn học đang sửa
  const [showPreview, setShowPreview] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [editSlot, setEditSlot] = useState({ thu: '', tiet: '', so_tiet: 1 });
  const gridRef = useRef();

  useEffect(() => {
    fetch('tkb.json')
      .then((res) => res.json())
      .then((data) => {
        setTkb(data.data);
        // Lấy danh sách môn học duy nhất từ tkb
        const uniqueSubjects = [];
        const mhpSet = new Set();
        data.data.forEach(item => {
          if (item.mhp && !mhpSet.has(item.mhp)) {
            uniqueSubjects.push({ mhp: item.mhp, ten: item.ten });
            mhpSet.add(item.mhp);
          }
        });
        setSubjects(uniqueSubjects);
      });
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

  // Thêm, sửa, xóa môn học
  const handleAddSubject = () => {
    setEditSubject({ mhp: '', ten: '' });
    setEditSlot({ thu: '', tiet: '', so_tiet: 1 });
  };
  const handleEditSubject = (subject) => {
    setEditSubject({ ...subject });
    // Tìm tiết đầu tiên của môn học để hiển thị lên form
    const slot = tkb.find(item => item.mhp === subject.mhp);
    setEditSlot({
      thu: slot?.thu || '',
      tiet: slot?.tiet || '',
      so_tiet: slot?.so_tiet || 1
    });
  };
  const handleDeleteSubject = (mhp) => {
    // Xóa môn học khỏi danh sách và tkb
    setSubjects(subjects.filter(s => s.mhp !== mhp));
    setTkb(tkb.filter(item => item.mhp !== mhp));
  };
  const handleSaveSubject = () => {
    if (!editSubject.mhp || !editSubject.ten) return;
    // Nếu là thêm mới
    if (!subjects.find(s => s.mhp === editSubject.mhp)) {
      setSubjects(prev => [...prev, { ...editSubject }]);
      // Thêm môn học mới vào tkb với tiết nhập từ form
      setTkb(prev => [...prev, {
        mhp: editSubject.mhp,
        ten: editSubject.ten,
        thu: Number(editSlot.thu),
        tiet: Number(editSlot.tiet),
        so_tiet: Number(editSlot.so_tiet)
      }]);
    } else {
      setSubjects(subjects.map(s => s.mhp === editSubject.mhp ? { ...editSubject } : s));
      // Nếu có nhập tiết mới khi sửa thì cập nhật tiết đầu tiên
      setTkb(tkb.map(item => {
        if (item.mhp === editSubject.mhp) {
          return {
            ...item,
            ten: editSubject.ten,
            thu: Number(editSlot.thu),
            tiet: Number(editSlot.tiet),
            so_tiet: Number(editSlot.so_tiet)
          };
        }
        return item;
      }));
    }
    setEditSubject(null);
    setEditSlot({ thu: '', tiet: '', so_tiet: 1 });
  };
  const handleCancelEdit = () => {
    setEditSubject(null);
    setEditSlot({ thu: '', tiet: '', so_tiet: 1 });
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f4f6f8', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', margin: '18px 0', fontWeight: 600, color: '#222', fontSize: 28 }}>Thời khóa biểu</h2>
      <div style={{ display: 'flex' }}>
        {/* Sidebar công cụ quản lý môn học */}
        <div style={{ width: 240, background: '#f0f1f3', borderRight: '1px solid #e0e0e0', padding: 12 }}>
          <h4 style={{ marginBottom: 10, fontWeight: 600, fontSize: 16, color: '#333' }}>Quản lý môn học</h4>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 12 }}>
            {subjects.map(subject => (
              <li key={subject.mhp} style={{ marginBottom: 6, padding: 7, background: '#fff', borderRadius: 4, color: '#222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, border: '1px solid #e0e0e0' }}>
                <span style={{ fontWeight: 500 }}>{subject.ten}</span>
                <span>
                  <button onClick={() => handleEditSubject(subject)} style={{ marginRight: 4, background: '#e0e0e0', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 13 }}>Sửa</button>
                  <button onClick={() => handleDeleteSubject(subject.mhp)} style={{ background: '#e53935', border: 'none', borderRadius: 3, padding: '2px 8px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Xóa</button>
                </span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
            <button
              onClick={handleAddSubject}
              style={{
                width: 100,
                height: 32,
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                lineHeight: '1.2',
              }}
            >
              Thêm môn
            </button>
            <button
              onClick={handlePreviewImage}
              style={{
                width: 100,
                height: 32,
                background: '#607d8b',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                lineHeight: '1.2',
              }}
            >
              Tải ảnh
            </button>
          </div>
          {/* Form thêm/sửa môn học */}
          {editSubject && (
            <div style={{ background: '#fff', borderRadius: 6, padding: 10, marginBottom: 10, border: '1px solid #e0e0e0' }}>
              <div style={{ marginBottom: 8 }}>
                Mã học phần<br />
                <input value={editSubject.mhp} onChange={e => setEditSubject({ ...editSubject, mhp: e.target.value })} placeholder="0001" style={{ width: '100%', padding: 5, borderRadius: 3, border: '1px solid #ccc', marginBottom: 5, fontSize: 14 }} disabled={!!subjects.find(s => s.mhp === editSubject.mhp)} />
                Thời gian<br />
                <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                  <select value={editSlot?.thu ?? ''} onChange={e => setEditSlot({ ...editSlot, thu: e.target.value })} style={{ width: '33%', padding: 5, borderRadius: 3, border: '1px solid #ccc', fontSize: 14 }}>
                    <option value="">Thứ</option>
                    {[2,3,4,5,6,7,8].map(thu => (
                      <option key={thu} value={thu}>Thứ {thu === 8 ? 'CN' : thu}</option>
                    ))}
                  </select>
                  <select value={editSlot?.tiet ?? ''} onChange={e => setEditSlot({ ...editSlot, tiet: e.target.value })} style={{ width: '33%', padding: 5, borderRadius: 3, border: '1px solid #ccc', fontSize: 14 }}>
                    <option value="">Tiết bắt đầu</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>Tiết {i+1}</option>
                    ))}
                  </select>
                  <select value={editSlot?.so_tiet ?? 1} onChange={e => setEditSlot({ ...editSlot, so_tiet: e.target.value })} style={{ width: '33%', padding: 5, borderRadius: 3, border: '1px solid #ccc', fontSize: 14 }}>
                    <option value="">Số tiết</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                Tên môn<br />
                <input value={editSubject.ten} onChange={e => setEditSubject({ ...editSubject, ten: e.target.value })} placeholder="Subject 1" style={{ width: '100%', padding: 5, borderRadius: 3, border: '1px solid #ccc', marginBottom: 5, fontSize: 14 }} />
                Nhóm môn<br />
                <input value={editSubject.nhom} onChange={e => setEditSubject({ ...editSubject, nhom: e.target.value })} placeholder="01" style={{ width: '100%', padding: 5, borderRadius: 3, border: '1px solid #ccc', marginBottom: 5, fontSize: 14 }} />
                Giảng viên<br />
                <input value={editSubject.giang_vien} onChange={e => setEditSubject({ ...editSubject, giang_vien: e.target.value })} placeholder="Nguyễn Văn A" style={{ width: '100%', padding: 5, borderRadius: 3, border: '1px solid #ccc', marginBottom: 5, fontSize: 14 }} />
                Phòng<br />
                <input value={editSubject.phong} onChange={e => setEditSubject({ ...editSubject, phong: e.target.value })} placeholder="C.A00" style={{ width: '100%', padding: 5, borderRadius: 3, border: '1px solid #ccc', marginBottom: 5, fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSaveSubject} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 3, padding: '5px 14px', cursor: 'pointer', fontSize: 14 }}>Lưu</button>
                <button onClick={handleCancelEdit} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 3, padding: '5px 14px', cursor: 'pointer', fontSize: 14 }}>Hủy</button>
              </div>
            </div>
          )}
        </div>
        {/* Grid thời khóa biểu */}
        <div style={{ flex: 1, overflowX: 'auto', padding: 18, background: '#f4f6f8', borderRadius: 0, boxShadow: 'none', border: 'none' }}>
          <table id="tkb-table" ref={gridRef} style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', background: '#fff', borderRadius: 0, overflow: 'hidden', fontFamily: 'inherit', fontSize: 15, border: '1px solid #e0e0e0' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #e0e0e0', padding: '10px 6px', background: '#f7f7f7', minWidth: 60, fontWeight: 600, color: '#333', fontSize: 15 }}>Tiết</th>
                {days.map(day => (
                  <th key={day} style={{ border: '1px solid #e0e0e0', padding: '10px 6px', background: '#f7f7f7', minWidth: 120, fontWeight: 600, color: '#333', fontSize: 15 }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td style={{ border: '1px solid #e0e0e0', padding: '10px 6px', background: '#fafafa', textAlign: 'center', fontWeight: 500, color: '#444' }}>{period}</td>
                  {days.map(day => {
                    const cell = grid[day][period];
                    if (cell === 'skip') return null;
                    if (cell) {
                      return (
                        <td key={day} rowSpan={cell.so_tiet} style={{ border: '1px solid #e0e0e0', padding: 0, height: 60 * cell.so_tiet, verticalAlign: 'top', background: '#fff' }}>
                          <div style={{
                            background: getSubjectColor(cell.mhp || ''),
                            borderRadius: 4,
                            padding: '8px 10px',
                            color: '#222',
                            fontSize: 15,
                            fontWeight: 500,
                            minHeight: `${54 * cell.so_tiet}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            border: '1px solid #e0e0e0',
                            boxShadow: 'none',
                            margin: 4,
                            lineHeight: 1.5,
                          }}>
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>{cell.ten || ''}</div>
                            {cell.mhp && <div style={{ fontSize: 14, color: '#444' }}>Mã HP: <b>{cell.mhp}</b></div>}
                            {cell.nhom && <div style={{ fontSize: 14, color: '#444' }}>Nhóm: <b>{cell.nhom}</b></div>}
                            {cell.giang_vien && <div style={{ fontSize: 14, color: '#444' }}>GV: <b>{cell.giang_vien}</b></div>}
                            {cell.phong && <div style={{ fontSize: 14, color: '#444' }}>Phòng: <b>{cell.phong}</b></div>}
                          </div>
                        </td>
                      );
                    }
                    return <td key={day} style={{ border: '1px solid #e0e0e0', padding: 0, height: 60, background: '#fff' }}/>;
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
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px #bbb', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 600, color: '#222', fontSize: 20 }}>Xem trước ảnh thời khóa biểu</h3>
            {previewImg && <img src={previewImg} alt="tkb preview" style={{ maxWidth: '80vw', maxHeight: '60vh', borderRadius: 6, boxShadow: '0 2px 8px #ccc', marginBottom: 18 }} />}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleDownloadImage} style={{ padding: '8px 22px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Tiếp tục</button>
              <button onClick={() => setShowPreview(false)} style={{ padding: '8px 22px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
