import TaskModel from './task';

export default class UserTaskModel extends TaskModel {
  get type() {
    return 'Gebruikerstaak';
  }
}
