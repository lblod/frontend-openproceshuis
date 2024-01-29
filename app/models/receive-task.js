import TaskModel from './task';

export default class ReceiveTaskModel extends TaskModel {
  get type() {
    return 'Ontvangsttaak';
  }
}
