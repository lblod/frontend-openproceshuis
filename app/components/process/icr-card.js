import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessIcrCardComponent extends Component {
  @service store;
  @service toaster;

  @tracked draftInformationAssets = [];

  @tracked edit = false;
  @tracked formIsValid = false;

  @action
  toggleEdit() {
    this.draftInformationAssets = this.args.process?.informationAssets ?? [];
    this.edit = !this.edit;
    this.validateForm();
  }

  @action
  resetModel() {
    this.args.process?.rollbackAttributes();
    this.draftInformationAssets = this.args.process?.informationAssets ?? [];
    this.edit = false;
  }

  validateForm() {
    this.formIsValid =
      this.args.process?.validate() &&
      (this.args.process?.hasDirtyAttributes ||
        this.draftInformationAssets.length <
          this.args.process?.informationAssets?.length ||
        this.draftInformationAssets.some((asset) => asset.isDraft));
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();
    if (!this.args.process) return;

    if (this.formIsValid) {
      this.args.process.modified = new Date();

      try {
        this.args.process.informationAssets = yield Promise.all(
          this.draftInformationAssets.map(async (asset) => {
            if (!asset.id) {
              const newAsset = this.store.createRecord('information-asset', {
                label: asset.label,
                scheme: ENV.conceptSchemes.informationAssets,
              });
              await newAsset.save();
              return newAsset;
            }
            delete asset.isDraft;
            return asset;
          })
        );

        yield this.args.process.save();

        this.edit = false;

        this.toaster.success(
          'Informatieclassificatie succesvol bijgewerkt',
          'Gelukt!',
          {
            timeOut: 5000,
          }
        );
      } catch (error) {
        console.error(error);
        this.toaster.error(
          'Informatieclassificatie kon niet worden bijgewerkt',
          'Fout'
        );
        this.resetModel();
      }
    } else {
      this.resetModel();
    }
  }

  @action
  setAvailabilityScore(value) {
    if (!this.args.process) return;
    this.args.process.availabilityScore = value;
    this.validateForm();
  }

  @action
  setIntegrityScore(value) {
    if (!this.args.process) return;
    this.args.process.integrityScore = value;
    this.validateForm();
  }

  @action
  setConfidentialityScore(value) {
    if (!this.args.process) return;
    this.args.process.confidentialityScore = value;
    this.validateForm();
  }

  @action
  setContainsPersonalData(value) {
    if (!this.args.process) return;

    this.args.process.containsPersonalData = value;

    if (!value) {
      this.args.process.containsProfessionalData = false;
      this.args.process.containsSensitivePersonalData = false;
    }

    this.validateForm();
  }

  @action
  setContainsProfessionalData(value) {
    if (!this.args.process) return;
    if (!this.args.process.containsPersonalData) return;

    this.args.process.containsProfessionalData = value;
    this.validateForm();
  }

  @action
  setContainsSensitivePersonalData(value) {
    if (!this.args.process) return;
    if (!this.args.process.containsPersonalData) return;

    this.args.process.containsSensitivePersonalData = value;
    if (value) this.args.process.containsProfessionalData = true;
    this.validateForm();
  }

  @action
  setAdditionalInformation(event) {
    if (!this.args.process) return;
    this.args.process.additionalInformation = event.target.value;
    this.validateForm();
  }

  @action
  setControlMeasure(event) {
    if (!this.args.process) return;
    this.args.process.hasControlMeasure = event.target.value;
    this.validateForm();
  }

  @action
  setDraftInformationAssets(event) {
    const assetLabels = event.map((asset) => asset.label.toLowerCase());
    const hasDuplicates = new Set(assetLabels).size !== assetLabels.length;
    if (hasDuplicates) return;

    this.draftInformationAssets = event;
    this.validateForm();
  }
}
