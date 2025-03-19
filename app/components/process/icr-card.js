import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask, timeout } from 'ember-concurrency';

export default class ProcessIcrCardComponent extends Component {
  // Temp ICR
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
    if (!this.args.process) return;
    this.args.process.availabilityScore = value;
  }

  @action
  setIntegrityScore(value) {
    if (!this.args.process) return;
    this.args.process.integrityScore = value;
  }

  @action
  setConfidentialityScore(value) {
    if (!this.args.process) return;
    this.args.process.confidentialityScore = value;
  }

  @action
  setContainsPersonalData(value) {
    if (!this.args.process) return;

    this.args.process.containsPersonalData = value;

    if (!value) {
      this.args.process.containsProfessionalData = false;
      this.args.process.containsSensitivePersonalData = false;
    }
  }

  @action
  setContainsProfessionalData(value) {
    if (!this.args.process) return;
    if (!this.args.process.containsPersonalData) return;

    this.args.process.containsProfessionalData = value;
  }

  @action
  setContainsSensitivePersonalData(value) {
    if (!this.args.process) return;
    if (!this.args.process.containsPersonalData) return;

    this.args.process.containsSensitivePersonalData = value;
    if (value) this.args.process.containsProfessionalData = true;
  }

  @action
  setAdditionalInformation(event) {
    if (!this.args.process) return;
    this.args.process.additionalInformation = event.target.value;
  }

  @action
  setControlMeasure(event) {
    if (!this.args.process) return;
    this.args.process.hasControlMeasure = event.target.value;
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
