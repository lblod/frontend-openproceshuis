import Service from '@ember/service';

export default class FieldService extends Service {
  get selectedFields() {
    return this.availableFields
      .filter((field) => field.isDefault)
      .map((field) => field.key);
  }

  get availableFields() {
    return [
      {
        key: 'title',
        label: 'Titel',
        category: 'Algemene informatie',
        isDefault: true,
        display: 'sticky',
      },
      {
        key: 'description',
        label: 'Beschrijving',
        hintText:
          'Dit is geen kolom in de tabel, maar wordt getoond als tooltip bij de titel.',
        category: 'Algemene informatie',
        isDefault: true,
        display: 'tooltip',
        tooltipFor: 'title',
      },
      {
        key: 'uploadedBy',
        label: 'Opgeladen door',
        category: 'Algemene informatie',
        isDefault: true,
        display: 'column',
      },
      {
        key: 'relevantFor',
        label: 'Relevant voor',
        category: 'Algemene informatie',
        isDefault: true,
        display: 'column',
      },
      {
        key: 'linkedProcess',
        label: 'Gekoppeld aan inventaris',
        category: 'Link met procesinventaris',
        isDefault: true,
        display: 'column',
      },
      {
        key: 'processCategory',
        label: 'Procescategorie',
        category: 'Link met procesinventaris',
        isDefault: true,
        display: 'column',
      },
    ];
  }
}
