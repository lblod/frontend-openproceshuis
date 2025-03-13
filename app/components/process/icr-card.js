import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask, timeout } from 'ember-concurrency';

export default class IcrCardComponent extends Component {
  // Temp ICR
  @tracked confidentialityScore = 1; // number
  @tracked integrityScore = 2; // number
  @tracked availabilityScore = 3; // number
  @tracked containsPersonalData; // boolean
  @tracked containsProfessionalData; // boolean
  @tracked containsSensitiveData; // boolean
  @tracked additionalInformation; // string
  @tracked hasControlMeasure; // url
  @tracked informationAssets; // array

  @tracked edit = false;
  @tracked formIsValid = false;

  @action
  toggleEdit() {
    this.edit = !this.edit;
  }

  @action
  resetModel() {
    this.edit = false;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    console.log('Saving ...');
    yield timeout(100);
    console.log('Saved!');
  }

  @action
  setAvailabilityScore(score) {
    this.availabilityScore = score;
  }

  @action
  setIntegrityScore(score) {
    this.integrityScore = score;
  }

  @action
  setConfidentialityScore(score) {
    this.confidentialityScore = score;
  }
}
