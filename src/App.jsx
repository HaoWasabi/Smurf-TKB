import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import TimetableView from './views/TimetableView';
import SidebarView from './views/SidebarView';
import { TimetableController } from './controllers/timetableController';

const controller = new TimetableController();

function App() {
  const [showDownloadJson, setShowDownloadJson] = useState(false);
  const [showLogoMsg, setShowLogoMsg] = useState(false);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  // Cho phép export dữ liệu tkb ra file json từ SidebarView
  window.tkb_data_export = () => ({
    name: 'Thời khóa biểu',
    created: new Date().toString(),
    data: controller.getRawData()
  });
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
  const handleDeleteAllSubjects = () => {
    setShowConfirmDeleteAll(true);
  };

  const confirmDeleteAllSubjects = () => {
    controller.deleteAllSubjects();
    syncData();
    setShowConfirmDeleteAll(false);
  };

  const cancelDeleteAllSubjects = () => {
    setShowConfirmDeleteAll(false);
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
    link.download = 'Smurf-TKB_tkb.png';
    link.href = previewImg;
    link.click();
  };

  return (
    <div style={{
      fontFamily: 'Baloo 2, Segoe UI, Arial, sans-serif',
      background: 'linear-gradient(135deg, #e3f0ff 0%, #fffbe7 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      <div style={{ background: 'rgba(255,255,255,0.85)', width: '100%', padding: '18px 0', marginBottom: 0, boxShadow: '0 2px 12px #b3e5fc33', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, position: 'relative' }}>
        {/* Icon Xì Trum bên trái header */}
        <h2 style={{ margin: 0, fontWeight: 700, color: '#1976d2', fontSize: 32, fontFamily: 'Baloo 2, Segoe UI, Arial, sans-serif', letterSpacing: 1 }}>Quản lý TKB</h2>
        {/* Icon sách vui nhộn bên phải header */}
      </div>
  <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <SidebarView
          subjects={subjects}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
          onDeleteAll={handleDeleteAllSubjects}
          onAdd={handleAddSubject}
          onPreview={handlePreviewImage}
          onJsonUpload={handleJsonUpload}
          onDownloadJson={() => setShowDownloadJson(true)}
          editSubject={editSubject}
          editSlot={editSlot}
          setEditSubject={setEditSubject}
          setEditSlot={setEditSlot}
          onSave={handleSaveSubject}
          onCancel={handleCancelEdit}
        />
      {showDownloadJson && (
        <div style={{ position: 'fixed', zIndex: 10000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px #bbb', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 320 }}>
            <h3 style={{ marginBottom: 14, fontWeight: 600, color: '#1976d2', fontSize: 20 }}>Xác nhận tải JSON</h3>
            <p>Bạn có chắc muốn tải file thời khóa biểu dưới dạng JSON?</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                onClick={() => {
                  const data = window.tkb_data_export ? window.tkb_data_export() : null;
                  const jsonStr = JSON.stringify({ data: data || [] }, null, 2);
                  const blob = new Blob([jsonStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Smurf-TKB_tkb.json';
                  a.click();
                  URL.revokeObjectURL(url);
                  setShowDownloadJson(false);
                }}
                style={{ padding: '8px 22px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}
              >Tải xuống</button>
              <button
                onClick={() => setShowDownloadJson(false)}
                style={{ padding: '8px 22px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}
              >Hủy</button>
            </div>
          </div>
        </div>
      )}
  <div style={{ flex: 1, overflowX: 'auto', padding: 18, background: 'transparent', borderRadius: 0, boxShadow: 'none', border: 'none' }}>
          <TimetableView tkb={tkb} />
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 17, color: '#1976d2', fontWeight: 600, letterSpacing: 1 }}>
            Smurf-TKB-v1.0.0
          </div>
        </div>
      </div>
      {showPreview && (
        <div style={{ position: 'fixed', zIndex: 10000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px #bbb', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 600, color: '#222', fontSize: 20 }}>Xem trước ảnh tải</h3>
            {previewImg && <img src={previewImg} alt="tkb preview" style={{ maxWidth: '80vw', maxHeight: '60vh', borderRadius: 6, boxShadow: '0 2px 8px #ccc', marginBottom: 18 }} />}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleDownloadImage} style={{ padding: '8px 22px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Tiếp tục</button>
              <button onClick={() => setShowPreview(false)} style={{ padding: '8px 22px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteAll && (
        <div style={{ position: 'fixed', zIndex: 10000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px #bbb', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 600, color: '#222', fontSize: 20 }}>Bạn có chắc muốn xóa hết dữ liệu?</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={confirmDeleteAllSubjects} style={{ padding: '8px 22px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Đồng ý</button>
              <button onClick={cancelDeleteAllSubjects} style={{ padding: '8px 22px', background: '#607d8b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Logo góc dưới bên phải màn hình */}
      <img
        src="Smurf-TKB_Store_logo.png"
        alt="Smurf-TKB Store Logo"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 70,
          height: 70,
          borderRadius: 18,
          boxShadow: '0 4px 24px #90caf9',
          background: '#fff',
          zIndex: 9999,
          objectFit: 'contain',
          padding: 10,
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onClick={() => setShowLogoMsg(true)}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      />

      {showLogoMsg && (
        <div style={{ position: 'fixed', zIndex: 10000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px #bbb', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 600, color: '#1976d2', fontSize: 20 }}>Opp!</h3>
            <p>Cửa hàng giao diện thời khóa biểu vẫn đang trong thời gian xây dựng.</p><p>Cảm ơn các Tí đã ghé thăm!</p>
            <img src="Smurf-TKB_Store_logo.png" alt="Smurf-TKB Store Logo" style={{ maxWidth: 120, maxHeight: 120, marginBottom: 18 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLogoMsg(false)} style={{ padding: '8px 22px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
