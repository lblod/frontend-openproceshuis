import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class AssociationModel extends BpmnElementModel {
  @attr('string') source;
  @attr('string') target;
}
