import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask } from 'ember-concurrency';
import { service } from '@ember/service';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessDetailsCardComponent extends Component {
  @service store;
  @service currentSession;
  @service toaster;
  @service router;

  @tracked _isEditing = false;
  @tracked formIsValid = false;
  @tracked draftIpdcProducts = [];
  @tracked relevantAdministrativeUnitsChanged = false;

  get processUsedByUs() {
    return this.args.process?.users?.includes(this.currentSession.group);
  }

  get isEditing() {
    return this._isEditing;
  }

  set isEditing(value) {
    this._isEditing = value;
    this.args.setIsEditing(value);
  }

  @action
  toggleEdit() {
    this.draftIpdcProducts = this.args.process?.ipdcProducts;
    this.isEditing = !this.isEditing;
    this.validateForm();
  }

  @action
  resetModel() {
    this.args.process?.rollbackAttributes();
    this.draftIpdcProducts = this.args.process?.ipdcProducts ?? [];
    this.relevantAdministrativeUnitsChanged = false;

    this.isEditing = false;
  }

  validateForm() {
    this.formIsValid =
      this.args.process?.validate() &&
      (this.args.process?.hasDirtyAttributes ||
        this.relevantAdministrativeUnitsChanged ||
        this.draftIpdcProducts.length <
          this.args.process?.ipdcProducts?.length ||
        this.draftIpdcProducts.some((product) => product.isDraft));
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();
    if (!this.args.process) return;

    this.args.process.cleanupAttributes();
    this.validateForm();

    if (this.formIsValid) {
      if (this.args.process.isBlueprint) {
        this.args.process.linkedBlueprints = [];
      }

      try {
        this.args.process.ipdcProducts = yield Promise.all(
          this.draftIpdcProducts.map(async (product) => {
            if (product.isDraft) {
              const existingProducts = await this.store.query(product.type, {
                filter: { 'product-number': product.productNumber },
              });
              if (existingProducts.length) return existingProducts[0];

              const newProduct = this.store.createRecord(product.type, {
                name: product.name,
                productNumber: product.productNumber,
              });
              await newProduct.save();
              return newProduct;
            }
            return product;
          }),
        );

        yield this.args.process.save();

        this.isEditing = false;
        this.args.onSaved?.();

        this.toaster.success('Proces succesvol bijgewerkt', 'Gelukt!', {
          timeOut: 5000,
        });
      } catch (error) {
        console.error(error);
        const errorMessage = getMessageForErrorCode('oph.updateModelFailed');
        this.toaster.error(errorMessage, 'Fout');
        this.resetModel();
      }
    } else {
      this.resetModel();
    }
  }

  @action
  setProcessTitle(event) {
    if (!this.args.process) return;
    this.args.process.title = event.target.value;
    this.validateForm();
  }

  @action
  setProcessDescription(event) {
    if (!this.args.process) return;
    this.args.process.description = event.target.value;
    this.validateForm();
  }

  @action
  setProcessEmail(event) {
    if (!this.args.process) return;
    this.args.process.email = event.target.value;
    this.validateForm();
  }

  @action
  setDraftIpdcProducts(event) {
    const productNumbers = event.map((product) => product.productNumber);
    const hasDuplicates =
      new Set(productNumbers).size !== productNumbers.length;
    if (hasDuplicates) return;

    this.draftIpdcProducts = event;
    this.validateForm();
  }

  @action
  setRelevantAdministrativeUnit(selection) {
    if (!this.args.process) return;
    this.args.process.relevantAdministrativeUnits = selection;
    this.relevantAdministrativeUnitsChanged = true;
    this.validateForm();
  }

  @action
  async updateProcessUsedByUs(isChecked) {
    const currentUser = this.currentSession.group;
    const users = await this.args.process?.users;
    if (isChecked) {
      users.push(currentUser);
    } else {
      const index = users.indexOf(currentUser);
      if (index !== -1) {
        users.splice(index, 1);
      }
    }
    await this.args.process.save({
      adapterOptions: { skipVersioning: true },
    });

    this.toaster.success(
      isChecked ? 'Proces in gebruik genomen' : 'Proces niet langer in gebruik',
      undefined,
      {
        timeOut: 2500,
      },
    );
    this.router.refresh();
  }

  @action
  toggleBlueprintStatus(event) {
    if (!this.args.process) return;
    this.args.process.isBlueprint = event;
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
}
