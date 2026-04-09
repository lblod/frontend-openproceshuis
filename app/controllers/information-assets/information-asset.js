import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InformationAssetsInformationAssetController extends Controller {
  queryParams = [
    'edit',
    'process',
    'parentRoute',
    { versionedAssetId: 'version' },
    { pageAttachments: 'page-attachments' },
    { sizeAttachments: 'size-attachments' },
    { sortAttachments: 'sort-attachments' },
  ];

  @service store;
  @service currentSession;
  @service toaster;
  @service router;
  @service versionedStore;

  @tracked edit = false;
  @tracked process = null;
  @tracked parentRoute = null;
  @tracked versionedAssetId = null;
  @tracked formIsValid = this.canonicalAsset.title?.trim().length > 0;
  @tracked isDeleteModalOpen = false;
  @tracked isSaving = false;
  @tracked errorMessageTitle;

  @tracked pageAttachments = 0;
  @tracked sizeAttachments = 10;
  @tracked sortAttachments = 'name';

  get canEdit() {
    return (
      this.currentSession.canEdit &&
      this.currentSession.group &&
      this.currentSession.isAbbOrDv &&
      this.currentSession.isAdmin
    );
  }

  get canonicalAsset() {
    return this.model.canonicalAsset;
  }

  get versionedAsset() {
    return this.model.versionedAsset;
  }

  get originatingProcess() {
    if (!this.process) return null;

    return this.canonicalAsset.processes.find(
      (process) => process.id === this.process,
    );
  }

  get breadcrumbParentTitle() {
    return this.originatingProcess?.title ?? 'Informatie assets';
  }

  get breadcrumbParentRoute() {
    return this.originatingProcess && this.parentRoute
      ? this.parentRoute
      : 'information-assets.index';
  }

  get breadcrumbParentModel() {
    return this.originatingProcess && this.parentRoute
      ? this.originatingProcess.id
      : null;
  }

  @action
  validateForm() {
    this.formIsValid = this.canonicalAsset.title?.trim().length > 0;
  }

  @action
  toggleEdit() {
    this.validateForm();
    this.edit = !this.edit;
  }

  @action
  cancelEdit() {
    this.canonicalAsset.rollbackAttributes();
    this.edit = false;
    this.errorMessageTitle = null;
  }

  @action
  setTitle(event) {
    this.errorMessageTitle = null;
    this.canonicalAsset.title = event.target.value;
    this.validateForm();
  }

  @action
  setDescription(event) {
    this.canonicalAsset.description = event.target.value;
  }

  saveChanges = task({ drop: true }, async () => {
    try {
      if (!this.canonicalAsset.hasDirtyAttributes) {
        this.toaster.success('Geen wijzigingen om op te slaan', undefined, {
          timeOut: 3000,
        });
        this.edit = false;
        if (this.process) {
          return this.router.transitionTo(
            this.parentRoute ?? 'processes.process',
            this.process,
          );
        }
        return;
      }

      let changes = this.canonicalAsset.changedAttributes();
      let titleChanged = 'title' in changes;
      if (titleChanged) {
        const checkDuplicateTitle = await this.store.query(
          'information-asset',
          {
            filter: {
              ':exact:title': this.canonicalAsset.title?.trim(),
              ':has:versions': true,
              ':not:status': ENV.resourceStates.archived,
            },
            page: { size: 1 },
          },
        );
        if (checkDuplicateTitle.length !== 0) {
          this.toaster.error(
            'Er bestaat al een informatieclassificatie met deze titel',
            null,
            { timeOut: 5000 },
          );
          this.errorMessageTitle = 'Deze titel bestaat al';
          return;
        }
      }

      const { canonicalRecord, oldVersionedRecord, newVersionedRecord } =
        await this.versionedStore.updateRecord(
          'information-asset',
          this.versionedAsset,
        );

      if (!newVersionedRecord) return;

      await canonicalRecord.save();
      await newVersionedRecord.save();
      await oldVersionedRecord.save();

      if (this.process) {
        this.router.transitionTo(
          this.parentRoute ?? 'processes.process',
          this.process,
        );
      } else {
        await this.router.transitionTo(
          'information-assets.information-asset',
          canonicalRecord.id,
          {
            queryParams: {
              version: newVersionedRecord.id,
              edit: false,
              process: this.process,
              parentRoute: this.parentRoute,
            },
          },
        );
        this.router.refresh('information-assets.information-asset');
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
  });

  @action
  openDeleteModal() {
    this.isDeleteModalOpen = true;
  }

  @action
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
  }

  onDeleteAsset = task({ drop: true }, async () => {
    try {
      this.closeDeleteModal();

      this.canonicalAsset.archive();
      this.canonicalAsset.modified = new Date();
      this.canonicalAsset.save();

      this.toaster.success('Informatie asset succesvol verwijderd', undefined, {
        timeOut: 5000,
      });
      this.router.transitionTo('information-assets.index');
      this.router.refresh();
    } catch (error) {
      console.error(error);
      this.toaster.error(
        'Er liep iets mis bij het verwijderen van de informatie asset',
        undefined,
        { timeOut: 5000 },
      );
    }
  });

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
}
