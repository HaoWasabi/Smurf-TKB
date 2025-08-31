// View: Hiển thị bảng thời khóa biểu
import React from 'react';

const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const periods = Array.from({ length: 10 }, (_, i) => i + 1);

function getSubjectColor(key) {
  const subjectColors = ['#A5D6A7','#90CAF9','#FFF59D','#F8BBD0','#FFCC80','#CE93D8','#EF9A9A'];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return subjectColors[Math.abs(hash) % subjectColors.length];
}

export default function TimetableView({ tkb }) {
  // Tạo ma trận thời khóa biểu
  const grid = {};
  days.forEach(day => {
    grid[day] = {};
    periods.forEach(period => {
      grid[day][period] = null;
    });
  });
  tkb.forEach(item => {
    if (item.thu && item.tiet) {
      const day = days[item.thu - 2];
      const period = item.tiet;
      const so_tiet = item.so_tiet || 1;
      grid[day][period] = { ...item, so_tiet };
      for (let i = 1; i < so_tiet; i++) {
        if (grid[day][period + i] !== undefined) grid[day][period + i] = 'skip';
      }
    }
  });
  return (
    <table id="tkb-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', background: '#fff', borderRadius: 0, overflow: 'hidden', fontFamily: 'inherit', fontSize: 15, border: '1px solid #e0e0e0' }}>
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
  );
}
