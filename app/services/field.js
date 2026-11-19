import Service from '@ember/service';

export default class FieldService extends Service {
  availableFieldsFor(context) {
    return this.availableFields.filter((field) => field.context === context);
  }

  fixedFieldsFor(context) {
    return this.availableFieldsFor(context).filter((field) => field.isFixed);
  }

  dynamicFieldsFor(context) {
    return this.availableFieldsFor(context).filter((field) => !field.isFixed);
  }

  get availableFields() {
    return [
      {
        key: 'title',
        context: 'processes',
        label: 'Titel',
        category: 'Algemene informatie',
        isSortable: true,
        isDefault: true,
        isFixed: true,
      },
      {
        key: 'description',
        context: 'processes',
        label: 'Beschrijving',
        hintText:
          'Om plaats te besparen, wordt de beschrijving als tooltip getoond wanneer je met de muis over de titel beweegt.',
        category: 'Algemene informatie',
        isDefault: true,
        isFixed: true,
        tooltipFor: 'title',
      },
      {
        key: 'organization',
        context: 'processes',
        label: 'Opgeladen door',
        category: 'Algemene informatie',
        isSortable: true,
        isDefault: true,
      },
      {
        key: 'classification',
        context: 'processes',
        label: 'Relevant voor',
        category: 'Algemene informatie',
        isSortable: true,
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
      {
        key: 'modified',
        context: 'processes',
        label: 'Laatst aangepast op',
        category: 'Algemene informatie',
        isSortable: true,
        isDefault: true,
      },
      {
        key: 'created',
        context: 'processes',
        label: 'Aangemaakt op',
        category: 'Algemene informatie',
        isSortable: true,
      },
      {
        key: 'blueprint',
        context: 'processes',
        label: 'Blauwdruk',
        category: 'Algemene informatie',
        isSortable: true,
      },
      {
        key: 'creator',
        context: 'processes',
        label: 'Via leverancier',
        category: 'Algemene informatie',
        isSortable: true,
      },
      {
        key: 'processGroup',
        label: 'Procesgroep',
        category: 'Link met procesinventaris',
      },
      {
        key: 'processDomain',
        label: 'Procesdomein',
        category: 'Link met procesinventaris',
      },
      {
        key: 'ipdcLpdcLink',
        label: 'Link naar IPDC/LPDC',
        category: 'Algemene informatie',
      },
      {
        key: 'usedBy',
        label: 'Gebruikt door',
        category: 'Algemene informatie',
      },
      {
        key: 'professionalData',
        label: 'Bevat professionele gegevens',
        category: 'Informatie Klasse Bepaling',
      },
      {
        key: 'personalData',
        label: 'Bevat persoonsgegevens',
        category: 'Informatie Klasse Bepaling',
      },
      {
        key: 'specialPersonalData',
        label: 'Bevat bijzondere persoonsgegevens',
        category: 'Informatie Klasse Bepaling',
      },
      {
        key: 'availability',
        label: 'Beschikbaarheid',
        category: 'Informatie Klasse Bepaling',
      },
      {
        key: 'integrity',
        label: 'Integriteit',
        category: 'Informatie Klasse Bepaling',
      },
      {
        key: 'confidentiality',
        label: 'Vertrouwelijkheid',
        category: 'Informatie Klasse Bepaling',
      },
      {
        key: 'informationAsset',
        label: 'Informatie-asset',
        category: 'Informatie Klasse Bepaling',
      },
      {
        key: 'processEmail',
        label: 'Emailadres proces',
        category: 'Algemene informatie',
      },
      {
        key: 'authorityEmail',
        label: 'Emailadres bestuur',
        category: 'Algemene informatie',
      },
      {
        key: 'diagramCount',
        label: 'Aantal diagrammen',
        category: 'Algemene informatie',
      },
      {
        key: 'linkedBlueprint',
        label: 'Gekoppeld aan blauwdruk',
        category: 'Algemene informatie',
      },
    ];
  }
}
