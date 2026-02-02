import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import { dropTask } from 'ember-concurrency';

import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessIcrCardComponent extends Component {
  @service store;
  @service toaster;
  @service router;

  @tracked informationAssets = [];
  @tracked blueprintUsages = A([]);

  @tracked edit = false;
  @tracked formIsValid = false;

  @tracked showIcrModal = false;
  @tracked selectedAsset = null;

  constructor() {
    super(...arguments);

    if (this.args.process.isBlueprint) {
      this.store
        .query('process', {
          'filter[linked-blueprints][id]': this.args.process.id,
        })
        .then((processes) => {
          this.blueprintUsages.pushObjects(processes);
        });
    }
  }

  get archivedUri() {
    return ENV.resourceStates.archived;
  }
  get confidentialityScore() {
    return Math.max(
      ...this.args.process.informationAssets.map(
        (asset) => asset.confidentialityScore,
      ),
    );
  }
  get integrityScore() {
    return Math.max(
      ...this.args.process.informationAssets.map(
        (asset) => asset.integrityScore,
      ),
    );
  }
  get availabilityScore() {
    return Math.max(
      ...this.args.process.informationAssets.map(
        (asset) => asset.availabilityScore,
      ),
    );
  }
  get containsPersonalData() {
    return this.args.process.informationAssets.some(
      (asset) => asset.containsPersonalData,
    );
  }
  get containsProfessionalData() {
    return this.args.process.informationAssets.some(
      (asset) => asset.containsProfessionalData,
    );
  }
  get containsSensitivePersonalData() {
    return this.args.process.informationAssets.some(
      (asset) => asset.containsSensitivePersonalData,
    );
  }

  @action editAsset(asset) {
    this.router.transitionTo('information-assets.edit', asset.id, {
      queryParams: { edit: true, process: this.args.process.id },
    });
  }

  @action
  toggleEdit() {
    this.informationAssets = this.args.process?.informationAssets ?? [];
    this.edit = !this.edit;
    this.validateForm();
  }

  @action
  resetModel() {
    this.args.process?.rollbackAttributes();
    this.informationAssets = this.args.process?.informationAssets ?? [];
    this.edit = false;
  }

  validateForm() {
    this.formIsValid = true;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();
    if (!this.args.process) return;

    if (this.formIsValid) {
      this.args.process.modified = new Date();

      try {
        this.args.process.informationAssets = this.informationAssets;
        yield this.args.process.save();

        this.edit = false;

        this.toaster.success(
          'Informatieclassificatie succesvol bijgewerkt',
          'Gelukt!',
          {
            timeOut: 5000,
          },
        );
      } catch (error) {
        console.error(error);
        const errorMessage = getMessageForErrorCode('oph.icrDataUpdateFailed');
        this.toaster.error(errorMessage, 'Fout');
        this.resetModel();
      }
    } else {
      this.resetModel();
    }
  }

  @action
  setInformationAssets(assets = []) {
    if (!assets.length) {
      this.informationAssets = [];
      this.validateForm();
      return;
    }

    const lowerCaseTitles = assets.map((asset) => asset.title.toLowerCase());
    const hasDuplicates =
      new Set(lowerCaseTitles).size !== lowerCaseTitles.length;
    if (hasDuplicates) return;

    const lastDraftAsset = [...assets].reverse().find((asset) => asset.isDraft);

    this.selectedAsset = lastDraftAsset
      ? {
          ...lastDraftAsset,
          title: lastDraftAsset.title || '',
          description: '',
          availabilityScore: 0,
          confidentialityScore: 0,
          integrityScore: 0,
          containsSensitivePersonalData: false,
          containsProfessionalData: false,
          containsPersonalData: false,
          created: new Date(),
          modified: new Date(),
        }
      : null;

    this.showIcrModal = lastDraftAsset && assets.at(-1).isDraft;

    this.informationAssets = assets;
    this.validateForm();
  }

  @action
  hasError(attribute) {
    if (!this.args.process) return false;
    const errorsForAttribute = this.args.process
      .get('errors')
      .filter((error) => error.attribute === attribute);
    return errorsForAttribute.length;
  }

  @action closeIcrModal() {
    this.showIcrModal = false;
    this.selectedAsset = null;
  }
}
