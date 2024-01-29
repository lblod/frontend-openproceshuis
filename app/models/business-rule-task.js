import TaskModel from './task';

export default class BusinessRuleTaskModel extends TaskModel {
  get type() {
    return 'Bedrijfsregeltaak';
  }
}
