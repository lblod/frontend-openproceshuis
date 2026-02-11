import Controller from '@ember/controller';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency';

export default class InformationAssetsIndexController extends Controller {
  size = 20;
  queryParams = [
    'page',
    'size',
    'title',
    'sort',
    'availabilityScore',
    'integrityScore',
    'confidentialityScore',
    'containsPersonalData',
    'containsProfessionalData',
    'containsSensitivePersonalData',
  ];
  @service currentSession;
  @service toaster;
  @service store;

  @tracked page = 0;
  @tracked sort = '-created';
  @tracked title = null;
  @tracked availabilityScore = null;
  @tracked integrityScore = null;
  @tracked confidentialityScore = null;
  @tracked isDeleteModalOpen = false;
  @tracked isCreateModalOpen = false;
  @tracked informationAssetToDelete = null;
  @tracked informationAsset = null;
  @tracked containsPersonalData = null;
  @tracked containsProfessionalData = null;
  @tracked containsSensitivePersonalData = null;

  get informationAssets() {
    return this.model.informationAssets.isFinished
      ? this.model.informationAssets.value
      : null;
  }

  get isLoading() {
    return this.model.informationAssets.isRunning;
  }

  get canEdit() {
    return (
      this.currentSession.canEdit &&
      this.currentSession.group &&
      this.currentSession.isAbbOrDv &&
      this.currentSession.isAdmin
    );
  }

  get noDataMessage() {
    return this.title
      ? 'Er werden geen zoekresultaten gevonden voor deze zoekopdracht: ' +
          this.title
      : 'Er werden geen resultaten gevonden.';
  }

  @action
  setTitle(selection) {
    this.title = selection;
  }

  @action
  setContainsProfessionalData(selection) {
    this.containsProfessionalData = selection ? true : null;
  }
  @action
  setContainsPersonalData(selection) {
    this.containsPersonalData = selection ? true : null;
  }

  @action
  setContainsSensitivePersonalData(selection) {
    this.containsSensitivePersonalData = selection ? true : null;
  }

  @action
  openDeleteModal(informationAsset) {
    this.informationAssetToDelete = informationAsset;
    this.isDeleteModalOpen = true;
  }

  @action
  closeDeleteModal() {
    this.informationAssetToDelete = null;
    this.isDeleteModalOpen = false;
  }

  @action
  openNewModal() {
    const informationAsset = {
      title: '',
      description: '',
      confidentialityScore: 0,
      availabilityScore: 0,
      integrityScore: 0,
      containsPersonalData: false,
      containsProfessionalData: false,
      containsSensitivePersonalData: false,
      creator: this.currentSession.group,
      created: new Date(),
      isDraft: true,
    };
    this.informationAsset = this.store.createRecord('information-asset', {
      ...informationAsset,
    });
    this.isCreateModalOpen = true;
  }
  @action
  closeNewModal(newIcr = null) {
    this.isCreateModalOpen = false;
    if (newIcr) {
      this.send('refreshModel');
      this.informationAsset = this.informationAsset.rollbackAttributes();
    }
  }

  @action
  resetFilters() {
    this.title = null;
    this.availabilityScore = null;
    this.integrityScore = null;
    this.confidentialityScore = null;
    this.containsPersonalData = null;
    this.containsProfessionalData = null;
    this.containsSensitivePersonalData = null;
    this.page = 0;
    this.sort = null;
  }

  onDeleteAsset = task({ drop: true }, async () => {
    try {
      if (!this.informationAssetToDelete) return;

      if (this.informationAssetToDelete.processes) {
        this.informationAssetToDelete.processes.forEach((process) => {
          process.informationAsset = null;
        });
        this.informationAssetToDelete.processes = [];
      }
      this.informationAssetToDelete.archive();
      this.informationAssetToDelete.modified = new Date();
      await this.informationAssetToDelete.save();

      this.toaster.success('Informatie asset succesvol verwijderd', undefined, {
        timeOut: 5000,
      });
      this.isDeleteModalOpen = false;
      this.send('refreshModel');
    } catch (error) {
      console.error(error);
      this.toaster.error(
        'Er liep iets mis bij het verwijderen van de informatie asset',
        undefined,
        { timeOut: 5000 },
      );
    }
  });
}
