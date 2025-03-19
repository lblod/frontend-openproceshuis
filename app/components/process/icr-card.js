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
  @tracked informationAssets;

  @tracked draftInformationAssets = [];

  @tracked edit = false;
  @tracked formIsValid = true;

  @action
  toggleEdit() {
    this.draftIpdcProducts = this.process?.ipdcProducts;
    this.edit = !this.edit;
  }

  @action
  resetModel() {
    this.draftInformationAssets = this.informationAssets;
    this.edit = false;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    console.log('Saving ...');
    yield timeout(100);

    this.informationAssets = this.draftInformationAssets;
    console.log('Saved!');

    this.edit = false;
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
  }

  @action
  setDraftInformationAssets(event) {
    const assetIds = event.map((asset) => asset.id);
    const hasDuplicates = new Set(assetIds).size !== assetIds.length;
    if (hasDuplicates) return;

    this.draftInformationAssets = event;
  }

  @action
  removeInformationAsset(assetId) {
    this.informationAssets = this.informationAssets.filter(
      (asset) => asset.id !== assetId
    );
  }
}
