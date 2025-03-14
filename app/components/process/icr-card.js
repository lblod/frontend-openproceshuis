import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask, timeout } from 'ember-concurrency';

export default class ProcessIcrCardComponent extends Component {
  // Temp ICR
  @tracked confidentialityScore = 1;
  @tracked integrityScore = 2;
  @tracked availabilityScore = 3;
  @tracked containsPersonalData = true;
  @tracked containsProfessionalData = true;
  @tracked containsSensitivePersonalData = false;
  @tracked additionalInformation =
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt, nam temporibus, maxime totam commodi id inventore repudiandae optio quia laudantium dolorum. Eius quas ratione optio harum architecto atque accusamus voluptatem. Lorem ipsum dolor sit amet consectetur adipisicing elit.'; // string
  @tracked hasControlMeasure = 'https://www.vlaanderen.be/';
  @tracked informationAssets = [
    { id: '5e89f94e-0569-4fd4-873c-dad047f14175', label: 'abonnement' },
    { id: '076f0d37-52ba-4844-88fd-93a420d4b812', label: 'abonnementsplaats' },
    {
      id: 'ae79a6b7-ae35-4b82-91d6-55638711c3cf',
      label: 'ambulante activiteit',
    },
    {
      id: '99c21667-f98c-4b60-a721-faef1a0ca67a',
      label: 'lang label om te testen',
    },
  ];

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
  setAvailabilityScore(value) {
    this.availabilityScore = value;
  }

  @action
  setIntegrityScore(value) {
    this.integrityScore = value;
  }

  @action
  setConfidentialityScore(value) {
    this.confidentialityScore = value;
  }

  @action
  setContainsPersonalData(value) {
    this.containsPersonalData = value;

    if (!value) {
      this.containsProfessionalData = false;
      this.containsSensitivePersonalData = false;
    }
  }

  @action
  setContainsProfessionalData(value) {
    if (!this.containsPersonalData) return;

    this.containsProfessionalData = value;
  }

  @action
  setContainsSensitivePersonalData(value) {
    if (!this.containsPersonalData) return;

    this.containsSensitivePersonalData = value;
    if (value) this.containsProfessionalData = true;
  }

  @action
  setAdditionalInformation(event) {
    this.additionalInformation = event.target.value;
  }

  @action
  setControlMeasure(event) {
    this.hasControlMeasure = event.target.value;
    console.log(this.hasControlMeasure);
  }

  @action
  removeInformationAsset(assetId) {
    this.informationAssets = this.informationAssets.filter(
      (asset) => asset.id !== assetId
    );
  }
}
