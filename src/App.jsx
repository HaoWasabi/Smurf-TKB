import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import TimetableView from './views/TimetableView';
import SidebarView from './views/SidebarView';
import { TimetableController } from './controllers/timetableController';

const controller = new TimetableController();

function App() {
  // Cookie helpers
  const setCookie = (name, value, days = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
  };
  const getCookie = (name) => {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  };

  // Load data from cookie on first render
  useEffect(() => {
    const cookieData = getCookie('tkb_data');
    if (cookieData) {
      try {
        const json = JSON.parse(cookieData);
        controller.loadData(json);
        setTkb(controller.getTimetable());
        setSubjects(controller.getSubjects());
      } catch (err) {
        // Nếu lỗi, xóa cookie
        setCookie('tkb_data', '', -1);
      }
    }
  }, []);
  const [tkb, setTkb] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editSubject, setEditSubject] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [editSlot, setEditSlot] = useState({ thu: '', tiet: '', so_tiet: 1 });
  const gridRef = useRef();

  // useEffect(() => {
  //   fetch('tkb.json')
  //     .then((res) => res.json())
  //     .then((data) => {
  //       controller.loadData(data.data);
  //       setTkb(controller.getTimetable());
  //       setSubjects(controller.getSubjects());
  //     });
  // }, []);

  // Đồng bộ dữ liệu khi controller thay đổi
  const syncData = () => {
  setTkb([...controller.getTimetable()]);
  setSubjects([...controller.getSubjects()]);
  // Lưu dữ liệu vào cookie
  setCookie('tkb_data', JSON.stringify(controller.getRawData()));
  };

  // Xử lý các thao tác CRUD
  const handleAddSubject = () => {
    setEditSubject({ mhp: '', ten: '' });
    setEditSlot({ thu: '', tiet: '', so_tiet: 1 });
  };
  const handleEditSubject = (subject) => {
    setEditSubject({ ...subject });
    const slot = tkb.find(item => item.mhp === subject.mhp);
    setEditSlot({
      thu: slot?.thu || '',
      tiet: slot?.tiet || '',
      so_tiet: slot?.so_tiet || 1
    });
  };
  const handleDeleteSubject = (mhp) => {
    controller.deleteSubject(mhp);
    syncData();
  };
  const handleSaveSubject = () => {
    if (!editSubject.mhp || !editSubject.ten) return;
    if (!subjects.find(s => s.mhp === editSubject.mhp)) {
      controller.addSubject(editSubject, {
        thu: Number(editSlot.thu),
        tiet: Number(editSlot.tiet),
        so_tiet: Number(editSlot.so_tiet)
      });
    } else {
      controller.editSubject(editSubject, {
        thu: Number(editSlot.thu),
        tiet: Number(editSlot.tiet),
        so_tiet: Number(editSlot.so_tiet)
      });
    }
    setEditSubject(null);
    setEditSlot({ thu: '', tiet: '', so_tiet: 1 });
    syncData();
  };
  const handleCancelEdit = () => {
    setEditSubject(null);
    setEditSlot({ thu: '', tiet: '', so_tiet: 1 });
  };

  // Xử lý upload JSON
  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        controller.mergeJson(json);
        syncData();
        alert('Đã tải và bổ sung dữ liệu từ JSON!');
      } catch (err) {
        alert('Lỗi khi đọc file JSON!');
      }
    };
    reader.readAsText(file);
  };

  // Xem trước/tải ảnh
  const handlePreviewImage = async () => {
    const table = document.querySelector('#tkb-table');
    if (!table) return;
    const canvas = await html2canvas(table, { backgroundColor: null, useCORS: true });
    setPreviewImg(canvas.toDataURL('image/png'));
    setShowPreview(true);
  };
  const handleDownloadImage = () => {
    if (!previewImg) return;
    const link = document.createElement('a');
    link.download = 'tkb.png';
    link.href = previewImg;
    link.click();
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f4f6f8', minHeight: '100vh' }}>
      <div style={{ background: '#f0f1f3', width: '100%', padding: '18px 0', marginBottom: 0 }}>
        <h2 style={{ textAlign: 'center', margin: 0, fontWeight: 600, color: '#222', fontSize: 28 }}>Thời khóa biểu</h2>
      </div>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <SidebarView
          subjects={subjects}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
          onAdd={handleAddSubject}
          onPreview={handlePreviewImage}
          onJsonUpload={handleJsonUpload}
          editSubject={editSubject}
          editSlot={editSlot}
          setEditSubject={setEditSubject}
          setEditSlot={setEditSlot}
          onSave={handleSaveSubject}
          onCancel={handleCancelEdit}
        />
        <div style={{ flex: 1, overflowX: 'auto', padding: 18, background: '#f4f6f8', borderRadius: 0, boxShadow: 'none', border: 'none' }}>
          <TimetableView tkb={tkb} />
        </div>
      </div>
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
