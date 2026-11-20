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
          'Om plaats te besparen, wordt de beschrijving als tooltip getoond wanneer je met de muis over de titel beweegt.',
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
      {
        key: 'lastEditDate',
        label: 'Laatst aangepast op',
        category: 'Algemene informatie',
        isDefault: true,
      },
      {
        key: 'creationDate',
        label: 'Aangemaakt op',
        category: 'Algemene informatie',
      },
      {
        key: 'blueprint',
        label: 'Blauwdruk',
        category: 'Algemene informatie',
      },
      {
        key: 'serviceProvider',
        label: 'Via leverancier',
        category: 'Algemene informatie',
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
