// Model: Quản lý dữ liệu thời khóa biểu và môn học
export class TimetableModel {
  getRawData() {
    return this.tkb;
  }
  constructor() {
    this.tkb = [];
    this.subjects = [];
  }
  setData(data) {
    this.tkb = data;
    this.subjects = this.getUniqueSubjects(data);
  }
  getUniqueSubjects(data) {
    const uniqueSubjects = [];
    const mhpSet = new Set();
    data.forEach(item => {
      if (item.mhp && !mhpSet.has(item.mhp)) {
        uniqueSubjects.push({ mhp: item.mhp, ten: item.ten });
        mhpSet.add(item.mhp);
      }
    });
    return uniqueSubjects;
  }
  addSubject(subject, slot) {
    if (!this.subjects.find(s => s.mhp === subject.mhp)) {
      this.subjects.push(subject);
      this.tkb.push({ ...subject, ...slot });
    }
  }
  editSubject(subject, slot) {
    this.subjects = this.subjects.map(s => s.mhp === subject.mhp ? subject : s);
    this.tkb = this.tkb.map(item => item.mhp === subject.mhp ? { ...item, ...subject, ...slot } : item);
  }
  deleteSubject(mhp) {
    this.subjects = this.subjects.filter(s => s.mhp !== mhp);
    this.tkb = this.tkb.filter(item => item.mhp !== mhp);
  }
  mergeJson(json) {
    if (json.data && Array.isArray(json.data)) {
      const validData = json.data.filter(item =>
        item.mhp && item.ten && item.thu && item.tiet && Number.isInteger(Number(item.thu)) && Number.isInteger(Number(item.tiet))
      ).map(item => ({
        mhp: String(item.mhp),
        ten: String(item.ten),
        thu: Number(item.thu),
        tiet: Number(item.tiet),
        so_tiet: Number(item.so_tiet) || 1,
        nhom: item.nhom ? String(item.nhom) : '',
        giang_vien: item.giang_vien ? String(item.giang_vien) : '',
        phong: item.phong ? String(item.phong) : ''
      }));
      validData.forEach(item => {
        if (!this.tkb.some(old => old.mhp === item.mhp && old.thu === item.thu && old.tiet === item.tiet)) {
          this.tkb.push(item);
        }
        if (!this.subjects.some(s => s.mhp === item.mhp)) {
          this.subjects.push({ mhp: item.mhp, ten: item.ten });
        }
      });
    }
  }
  getTimetable() {
    return this.tkb;
  }
  getSubjects() {
    return this.subjects;
  }
}
