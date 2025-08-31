// View: Sidebar quản lý môn học
import React from 'react';

export default function SidebarView({ subjects, onEdit, onDelete, onDeleteAll, onAdd, onPreview, onJsonUpload, editSubject, editSlot, setEditSubject, setEditSlot, onSave, onCancel }) {
  return (
    <div style={{ width: 240, background: '#f0f1f3', borderRight: '1px solid #e0e0e0', padding: 12, minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ marginBottom: 10, fontWeight: 600, fontSize: 16, color: '#333' }}>Quản lý môn học</h4>
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: 12 }}>
        {subjects.map(subject => (
          <li key={subject.mhp} style={{ marginBottom: 6, padding: 7, background: '#fff', borderRadius: 4, color: '#222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, border: '1px solid #e0e0e0' }}>
            <span style={{ fontWeight: 500 }}>{subject.ten}</span>
            <span>
              <button onClick={() => onEdit(subject)} style={{ marginRight: 4, background: '#e0e0e0', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 13 }}>Sửa</button>
              <button onClick={() => onDelete(subject.mhp)} style={{ background: '#e53935', border: 'none', borderRadius: 3, padding: '2px 8px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Xóa</button>
            </span>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={onAdd} style={{ width: 100, height: 32, background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', lineHeight: '1.2' }}>Thêm môn</button>
        <button onClick={onDeleteAll} style={{ width: 100, height: 32, background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', lineHeight: '1.2' }}>Xóa hết</button>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
        <button
          onClick={() => {
            // Tạo dữ liệu json từ subjects và tkb
            const data = window.tkb_data_export ? window.tkb_data_export() : null;
            const jsonStr = JSON.stringify({ data: data || [] }, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Smurf-TKB_tkb.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{ width: 100, height: 32, background: '#607d8b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', lineHeight: '1.2' }}
        >Tải json</button>
        <button onClick={onPreview} style={{ width: 100, height: 32, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', lineHeight: '1.2' }}>Tải ảnh</button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="json-upload" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#333', fontWeight: 500 }}>Upload JSON</label>
        <input id="json-upload" type="file" accept="application/json" style={{ width: '100%' }} onChange={onJsonUpload} />
      </div>
      {editSubject && (
        <div style={{ background: '#fff', borderRadius: 6, padding: 10, marginBottom: 10, border: '1px solid #e0e0e0' }}>
          <div style={{ marginBottom: 8 }}>
            Mã học phần<br />
            <input value={editSubject.mhp} onChange={e => setEditSubject({ ...editSubject, mhp: e.target.value })} placeholder="0001" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 8, fontSize: 15, boxSizing: 'border-box' }} disabled={!!subjects.find(s => s.mhp === editSubject.mhp)} />
            Thời gian<br />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select value={editSlot?.thu ?? ''} onChange={e => setEditSlot({ ...editSlot, thu: e.target.value })} style={{ width: '33%', padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 15, boxSizing: 'border-box' }}>
                <option value="">Thứ</option>
                {[2,3,4,5,6,7,8].map(thu => (
                  <option key={thu} value={thu}>Thứ {thu === 8 ? 'CN' : thu}</option>
                ))}
              </select>
              <select value={editSlot?.tiet ?? ''} onChange={e => setEditSlot({ ...editSlot, tiet: e.target.value })} style={{ width: '33%', padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 15, boxSizing: 'border-box' }}>
                <option value="">Tiết bắt đầu</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i+1} value={i+1}>Tiết {i+1}</option>
                ))}
              </select>
              <select value={editSlot?.so_tiet ?? 1} onChange={e => setEditSlot({ ...editSlot, so_tiet: e.target.value })} style={{ width: '33%', padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 15, boxSizing: 'border-box' }}>
                <option value="">Số tiết</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
            </div>
            Tên môn<br />
            <input value={editSubject.ten} onChange={e => setEditSubject({ ...editSubject, ten: e.target.value })} placeholder="Subject 1" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 8, fontSize: 15, boxSizing: 'border-box' }} />
            Nhóm môn<br />
            <input value={editSubject.nhom} onChange={e => setEditSubject({ ...editSubject, nhom: e.target.value })} placeholder="01" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 8, fontSize: 15, boxSizing: 'border-box' }} />
            Giảng viên<br />
            <input value={editSubject.giang_vien} onChange={e => setEditSubject({ ...editSubject, giang_vien: e.target.value })} placeholder="Nguyễn Văn A" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 8, fontSize: 15, boxSizing: 'border-box' }} />
            Phòng<br />
            <input value={editSubject.phong} onChange={e => setEditSubject({ ...editSubject, phong: e.target.value })} placeholder="C.A00" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginBottom: 8, fontSize: 15, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onSave} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 3, padding: '5px 14px', cursor: 'pointer', fontSize: 14 }}>Lưu</button>
            <button onClick={onCancel} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 3, padding: '5px 14px', cursor: 'pointer', fontSize: 14 }}>Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
}
