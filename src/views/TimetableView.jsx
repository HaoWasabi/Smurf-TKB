
import React from 'react';
import '../styles/timetable.css';

const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const periods = Array.from({ length: 10 }, (_, i) => i + 1);

function getCourseClass(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return `course course-${Math.abs(hash) % 10}`;
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
    <table id="tkb-table" className="timetable-table">
      <thead>
        <tr>
          <th className="stt">Tiết</th>
          {days.map(day => (
            <th key={day} className="thead_td">{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {periods.map(period => (
          <tr key={period}>
            <td className="stt">{period}</td>
            {days.map(day => {
              const cell = grid[day][period];
              if (cell === 'skip') return null;
              if (cell) {
                return (
                  <td key={day} rowSpan={cell.so_tiet} className="col_basic">
                    <div className={getCourseClass(cell.mhp || '')} style={{ minHeight: `${54 * cell.so_tiet}px` }}>
                      <div className="course-info">
                        <span style={{ fontWeight: 700 }}>{cell.ten || ''}</span>
                        {cell.mhp && <span className="course-room">Mã HP: <b>{cell.mhp}</b></span>}
                        {cell.nhom && <span className="course-room">Nhóm: <b>{cell.nhom}</b></span>}
                        {cell.giang_vien && <span className="course-teacher">GV: <b>{cell.giang_vien}</b></span>}
                        {cell.phong && <span className="course-room">Phòng: <b>{cell.phong}</b></span>}
                      </div>
                    </div>
                  </td>
                );
              }
              return <td key={day} className="col_basic" />;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
