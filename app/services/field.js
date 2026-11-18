import Service from '@ember/service';

export default class FieldService extends Service {
  get fixedFields() {
    return this.availableFields.filter((field) => field.isFixed);
  }

  get dynamicFields() {
    return this.availableFields.filter((field) => !field.isFixed);
  }

  get availableFields() {
    return [
      {
        key: 'title',
        label: 'Titel',
        category: 'Algemene informatie',
        isDefault: true,
        isFixed: true,
      },
      {
        key: 'description',
        label: 'Beschrijving',
        hintText:
          'Dit is geen kolom in de tabel, maar wordt getoond als tooltip bij de titel.',
        category: 'Algemene informatie',
        isDefault: true,
        isFixed: true,
        tooltipFor: 'title',
      },
      {
        key: 'uploadedBy',
        label: 'Opgeladen door',
        category: 'Algemene informatie',
        isDefault: true,
      },
      {
        key: 'relevantFor',
        label: 'Relevant voor',
        category: 'Algemene informatie',
        isDefault: true,
      },
      {
        key: 'linkedProcess',
        label: 'Gekoppeld aan inventaris',
        category: 'Link met procesinventaris',
        isDefault: true,
      },
      {
        key: 'processCategory',
        label: 'Procescategorie',
        category: 'Link met procesinventaris',
        isDefault: true,
      },
    ];
  }
}
