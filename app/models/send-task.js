import TaskModel from './task';

export default class SendTaskModel extends TaskModel {
  get type() {
    return 'Verzendtaak';
  }
}
