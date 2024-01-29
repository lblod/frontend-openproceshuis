import TaskModel from './task';

export default class ManualTaskModel extends TaskModel {
  get type() {
    return 'Handmatige taak';
  }
}
