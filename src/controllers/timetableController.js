// Controller: Xử lý logic thao tác
import { TimetableModel } from '../models/timetable';

export class TimetableController {
  getRawData() {
    return this.model.getRawData();
  }
  constructor() {
    this.model = new TimetableModel();
  }
  loadData(data) {
    this.model.setData(data);
  }
  addSubject(subject, slot) {
    this.model.addSubject(subject, slot);
  }
  editSubject(subject, slot) {
    this.model.editSubject(subject, slot);
  }
  deleteSubject(mhp) {
    this.model.deleteSubject(mhp);
  }
  mergeJson(json) {
    this.model.mergeJson(json);
  }
  getTimetable() {
    return this.model.getTimetable();
  }
  getSubjects() {
    return this.model.getSubjects();
  }
}
