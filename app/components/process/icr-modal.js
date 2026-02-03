import { action } from '@ember/object';
import Component from '@glimmer/component';
import { task } from 'ember-concurrency';
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
      if (this.args.setOptions) {
        this.args.setOptions(newOptions);
      }
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
  resetModal() {
    this.draftInformationAssets = this.args.options || [];
    this.formIsValid = false;
  }

  @action
  validateForm() {
    this.formIsValid = this.args.selected.title?.trim().length > 0;
  }

  updateModel = task({ drop: true }, async (event) => {
    event.preventDefault();

    if (!this.args.selected || !this.formIsValid) {
      return;
    }

    this.isLoading = true;

    const oldAsset = this.args.selected;
    const newAssetData = {
      title: this.args.selected.title,
      availabilityScore: this.args.selected.availabilityScore,
      confidentialityScore: this.args.selected.confidentialityScore,
      integrityScore: this.args.selected.integrityScore,
      containsPersonalData: this.args.selected.containsPersonalData,
      containsProfessionalData: this.args.selected.containsProfessionalData,
      containsSensitivePersonalData:
        this.args.selected.containsSensitivePersonalData,
      created: new Date(),
      modified: new Date(),
      description: this.args.selected.description,
      status: this.args.selected.status,
      creator: this.currentSession.group,
    };
    const newAsset = this.store.createRecord('information-asset', newAssetData);

    try {
      let isNew = false;
      if (oldAsset.isDraft) {
        isNew = true;
        await newAsset.save();
      }
      const nonDraftAssets = this.draftInformationAssets.filter(
        (asset) => !asset.isDraft,
      );
      if (this.args.setOptions) {
        this.args.setOptions([...nonDraftAssets, newAsset]);
      }

      this.toaster.success(
        isNew
          ? 'Nieuwe informatie asset succesvol toegevoegd.'
          : 'Informatie asset succesvol bijgewerkt.',
        'Gelukt!',
        { timeOut: 5000 },
      );

      this.resetModal();
      this.args.closeModal(newAsset);
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.icrDataUpdateFailed');
      this.toaster.error(errorMessage, 'Fout');

      this.resetModal();
      this.args.closeModal();
    } finally {
      this.isLoading = false;
    }
  });
}
