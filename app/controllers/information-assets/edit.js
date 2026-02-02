import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { keepLatestTask } from 'ember-concurrency';

export default class InformationAssetIndexController extends Controller {
  queryParams = ['edit', 'process'];

  @service('store') store;
  @service currentSession;
  @service toaster;
  @service router;

  @tracked edit = false;
  @tracked process = null;
  @tracked formIsValid = this.informationAsset.title?.trim().length > 0;
  @tracked isDeleteModalOpen = false;
  @tracked isSaving = false;

  @tracked versionTimeline = [];

  get canEdit() {
    return (
      this.currentSession.canEdit &&
      this.currentSession.group &&
      this.currentSession.isAbbOrDv
    );
  }

  get informationAsset() {
    return this.model;
  }

  get isArchived() {
    return this.informationAsset.isArchived();
  }

  @action
  validateForm() {
    this.formIsValid = this.informationAsset.title?.trim().length > 0;
  }

  @action
  toggleEdit() {
    this.validateForm();
    this.edit = !this.edit;
  }

  @action
  cancelEdit() {
    this.informationAsset.rollbackAttributes();
    this.edit = false;
  }

  @action
  setTitle(event) {
    this.informationAsset.title = event.target.value;
    this.validateForm();
  }

  @action
  setDescription(event) {
    this.informationAsset.description = event.target.value;
  }

  @action
  async saveChanges() {
    try {
      this.isSaving = true;

      if (!this.informationAsset.hasDirtyAttributes) {
        this.toaster.success('Geen wijzigingen om op te slaan', undefined, {
          timeOut: 3000,
        });
        this.isSaving = false;
        this.edit = false;
        if (this.process) {
          return this.router.transitionTo('processes.process', this.process);
        }
        return;
      }

      const oldAsset = this.informationAsset;

      const newAsset = this.store.createRecord('information-asset', {
        title: oldAsset.title,
        description: oldAsset.description,
        confidentialityScore: oldAsset.confidentialityScore,
        integrityScore: oldAsset.integrityScore,
        availabilityScore: oldAsset.availabilityScore,
        containsPersonalData: oldAsset.containsPersonalData,
        containsProfessionalData: oldAsset.containsProfessionalData,
        containsSensitivePersonalData: oldAsset.containsSensitivePersonalData,
        creator: this.currentSession.group,
        previousVersion: oldAsset,
        processes: oldAsset.processes.slice(),
        created: new Date(),
        modified: new Date(),
      });

      await newAsset.save();
      const existingNext = await oldAsset.nextVersions;
      const nextVersions = [...existingNext, newAsset];

      oldAsset.rollbackAttributes();
      oldAsset.archive();
      oldAsset.processes = [];
      oldAsset.nextVersions = nextVersions;
      oldAsset.modified = new Date();
      await oldAsset.save();
      if (this.process) {
        this.router.transitionTo('processes.process', this.process);
      } else {
        this.router.transitionTo('information-assets.edit', newAsset.id);
      }

      this.edit = false;
      this.toaster.success(
        'Wijzigingen aan informatie asset succesvol opgeslagen',
        undefined,
        { timeOut: 5000 },
      );
    } catch (error) {
      console.error(error);
      this.toaster.error(
        'Er liep iets mis bij het opslaan van de wijzigingen aan de informatie asset',
        undefined,
        { timeOut: 5000 },
      );
    } finally {
      this.isSaving = false;
    }
  }

  @action
  openDeleteModal() {
    this.isDeleteModalOpen = true;
  }

  @action
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
  }

  @action
  onDeleteAsset() {
    try {
      this.isSaving = true;
      this.isDeleteModalOpen = false;

      if (this.informationAsset.processes) {
        this.informationAsset.processes.forEach((process) => {
          process.informationAsset = null;
        });
        this.informationAsset.processes = [];
      }

      this.informationAsset.archive();
      this.informationAsset.modified = new Date();
      this.informationAsset.save();

      this.toaster.success('Informatie asset succesvol verwijderd', undefined, {
        timeOut: 5000,
      });
      this.router.transitionTo('information-assets.index');
      this.router.refresh();
      this.isSaving = false;
    } catch (error) {
      console.error(error);
      this.toaster.error(
        'Er liep iets mis bij het verwijderen van de informatie asset',
        undefined,
        { timeOut: 5000 },
      );
      this.isSaving = false;
    }
  }

  @action
  copyUrl() {
    try {
      navigator.clipboard.writeText(globalThis.location.href);
      this.toaster.success('Link naar informatie asset gekopieerd', undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het kopiëren van de link naar de informatie asset',
        undefined,
        {
          timeOut: 5000,
        },
      );
      throw error;
    }
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadFullHistory(asset) {
    if (!asset) return [];

    const visited = new Set();
    const allAssets = [];

    function* traverse(a) {
      if (!a || visited.has(a.id)) return;
      visited.add(a.id);

      if (a.previousVersion) yield a.previousVersion;
      const previousVersions = yield a.previousVersions;
      const nextVersions = yield a.nextVersions;

      allAssets.push(a);

      if (a.previousVersion) yield* traverse(a.previousVersion);

      for (let prev of previousVersions) {
        yield* traverse(prev);
      }

      for (let next of nextVersions) {
        yield* traverse(next);
      }
    }

    yield* traverse(asset);

    allAssets.sort((a, b) => new Date(a.created) - new Date(b.created));

    return allAssets;
  }

  @action
  loadTimeline() {
    const assetTask = this.model;
    if (assetTask?.then) {
      assetTask.then((asset) => {
        this.versionTimeline = this.loadFullHistory.perform(asset);
      });
    } else if (assetTask) {
      this.versionTimeline = this.loadFullHistory.perform(assetTask);
    }
  }
}
