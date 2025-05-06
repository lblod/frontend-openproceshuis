import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default class ProcessDetailsCardComponent extends Component {
  @service store;
  @service currentSession;
  @service toaster;

  @tracked _isEditing = false;
  @tracked formIsValid = false;
  @tracked draftIpdcProducts = [];
  @tracked processUserChanged = undefined;
  @tracked originalUsers = undefined;

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
    if (!this.isEditing)
      this.originalUsers = this.args.process?.users?.slice() || [];
    this.isEditing = !this.isEditing;
    this.validateForm();
  }

  @action
  resetModel() {
    this.args.process?.rollbackAttributes();
    this.draftIpdcProducts = this.args.process?.ipdcProducts ?? [];

    if (this.processUserChanged && this.originalUsers) {
      const users = this.args.process?.users;
      users.clear();
      this.originalUsers.forEach((user) => users.pushObject(user));
      this.processUserChanged = false;
    }

    this.isEditing = false;
  }

  validateForm() {
    this.formIsValid =
      this.args.process?.validate() &&
      (this.args.process?.hasDirtyAttributes ||
        this.processUserChanged ||
        this.draftIpdcProducts.length <
          this.args.process?.ipdcProducts?.length ||
        this.draftIpdcProducts.some((product) => product.isDraft));
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();
    if (!this.args.process) return;

    if (this.formIsValid) {
      this.args.process.modified = new Date();

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
          })
        );

        yield this.args.process.save();

        this.isEditing = false;

        this.toaster.success('Proces succesvol bijgewerkt', 'Gelukt!', {
          timeOut: 5000,
        });
      } catch (error) {
        console.error(error);
        this.toaster.error('Proces kon niet worden bijgewerkt', 'Fout');
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
  async setProcessUsedByUs(isChecked) {
    this.processUserChanged = true;
    const currentUser = this.currentSession.group;
    const users = await this.args.process?.users;
    if (isChecked) {
      users.pushObject(currentUser);
    } else {
      users.removeObject(currentUser);
    }
    this.validateForm();
  }

  @action
  toggleBlueprintStatus(event) {
    if (!this.args.process) return;
    this.args.process.isBlueprint = event;
    this.validateForm();
  }
}
