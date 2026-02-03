import { action } from '@ember/object';
import Component from '@glimmer/component';
import { dropTask } from 'ember-concurrency';
import { tracked } from 'tracked-built-ins';
import { service } from '@ember/service';

import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class IcrModalComponent extends Component {
  @service store;
  @service toaster;
  @tracked selected;
  @tracked isLoading = false;
  @tracked formIsValid = this.args.selected.title?.trim().length > 0;
  @tracked draftInformationAssets = this.args.options || [];
  @service currentSession;

  get header() {
    if (this.args.selected.isDraft) {
      return 'Nieuwe informatieclassificatie';
    } else {
      return 'Wijzig informatieclassificatie: ' + this.args.selected.title;
    }
  }

  @action
  closeModal() {
    if (this.args.selected.isDraft) {
      const newOptions = this.draftInformationAssets.filter(
        (asset) => asset.isDraft !== true,
      );
      this.args.setOptions(newOptions);
    }
    this.args.closeModal();
  }

  @action
  setAvailabilityScore(value) {
    if (!this.args.selected) return;
    this.args.selected.availabilityScore = value;
    this.validateForm();
  }

  @action
  setTitle(event) {
    if (!this.args.selected) return;
    this.args.selected.title = event.target.value;
    this.validateForm();
  }

  @action
  setDescription(event) {
    if (!this.args.process) return;
    this.args.selected.description = event.target.value;
    this.validateForm();
  }

  @action
  setIntegrityScore(value) {
    if (!this.args.selected) return;
    this.args.selected.integrityScore = value;
    this.validateForm();
  }

  @action
  setConfidentialityScore(value) {
    if (!this.args.selected) return;
    this.args.selected.confidentialityScore = value;
    this.validateForm();
  }

  @action
  setContainsPersonalData(value) {
    if (!this.args.selected) return;
    this.args.selected.containsPersonalData = value;
    this.validateForm();
  }

  @action
  setContainsProfessionalData(value) {
    this.args.selected.containsProfessionalData = value;
    this.validateForm();
  }

  @action
  setContainsSensitivePersonalData(value) {
    this.args.selected.containsSensitivePersonalData = value;
    this.validateForm();
  }

  @action
  resetModal() {
    this.draftInformationAssets = this.args.options || [];
    this.formIsValid = false;
  }

  @action
  validateForm() {
    this.formIsValid = this.args.selected.title?.trim().length > 0;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    if (!this.args.selected || !this.formIsValid) {
      return;
    }

    this.isLoading = true;

    let assetRecord;

    const assetData = {
      title: this.args.selected.title,
      availabilityScore: this.args.selected.availabilityScore,
      confidentialityScore: this.args.selected.confidentialityScore,
      integrityScore: this.args.selected.integrityScore,
      containsPersonalData: this.args.selected.containsPersonalData,
      containsProfessionalData: this.args.selected.containsProfessionalData,
      containsSensitivePersonalData:
        this.args.selected.containsSensitivePersonalData,
      created: new Date(),
      description: this.args.selected.description,
      status: this.args.selected.status,
      creator: this.currentSession.group,
    };

    try {
      if (this.args.selected.isDraft) {
        assetRecord = this.store.createRecord('information-asset', assetData);
        yield assetRecord.save();
      } else {
        assetRecord = this.args.selected;
        assetRecord.setProperties(assetData);

        const savedAsset = yield assetRecord.save();

        this.args.process.informationAssets = [
          ...this.args.process.informationAssets.filter(
            (ia) => ia.id !== savedAsset.id,
          ),
          savedAsset,
        ];

        yield this.args.process.save();
      }
      const nonDraftAssets = this.draftInformationAssets.filter(
        (asset) => !asset.isDraft,
      );
      this.args.setOptions([...nonDraftAssets, assetRecord]);

      this.toaster.success(
        'Informatieclassificatie succesvol bijgewerkt',
        'Gelukt!',
        { timeOut: 5000 },
      );

      this.resetModal();
      this.args.closeModal();
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.icrDataUpdateFailed');
      this.toaster.error(errorMessage, 'Fout');

      this.resetModal();
      this.args.closeModal();
    } finally {
      this.isLoading = false;
    }
  }
}
