import { action } from '@ember/object';
import Component from '@glimmer/component';
import { task } from 'ember-concurrency';
import { tracked } from 'tracked-built-ins';
import { service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';

import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class IcrModalComponent extends Component {
  @service store;
  @service toaster;
  @service currentSession;

  @tracked formIsValid = this.args.selected.title?.trim().length > 0;
  @tracked draftInformationAssets = this.args.options || [];
  @tracked selected;
  @tracked errorMessageTitle;

  get validForm() {
    return this.formIsValid || this.args.selected.title?.trim().length > 0;
  }

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
    this.errorMessageTitle = null;
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
    this.errorMessageTitle = null;
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

    if (!this.args.selected || !this.validForm) {
      return;
    }

    const checkDuplicateTitle = await this.store.query('information-asset', {
      filter: {
        ':exact:title': this.args.selected.title?.trim(),
        ':not:status': ENV.resourceStates.archived,
      },
      page: { size: 1 },
    });
    if (checkDuplicateTitle.length !== 0) {
      this.toaster.error(
        'Er bestaat al een informatieclassificatie met deze titel',
        null,
        { timeOut: 5000 },
      );
      this.errorMessageTitle = 'Deze titel bestaat al';
      return;
    }

    const oldAsset = this.args.selected;
    const newAssetData = {
      title: this.args.selected.title?.trim(),
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
    }
  });
}
