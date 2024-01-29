import TaskModel from './task';

export default class ScriptTaskModel extends TaskModel {
  get type() {
    return 'Scripttaak';
  }
}
