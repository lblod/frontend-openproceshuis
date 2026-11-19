import Service from '@ember/service';

export function isAttachedField(field) {
  return Boolean(field.tooltipFor || field.iconFor);
}

export default class FieldService extends Service {
  availableFieldsFor(context) {
    return this.availableFields
      .filter((field) => field.context === context)
      .sort(
        (a, b) =>
          (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER),
      );
  }

  fixedFieldsFor(context) {
    return this.availableFieldsFor(context).filter((field) => field.isFixed);
  }

  dynamicFieldsFor(context) {
    return this.availableFieldsFor(context).filter(
      (field) => !field.isFixed && !isAttachedField(field),
    );
  }

  get availableFields() {
    // TODO - move this to the database (migration)
    return [
      {
        key: 'title',
        context: 'processes',
        label: 'Titel',
        category: 'Algemene informatie',
        isSortable: true,
        isDefault: true,
        isFixed: true,
        order: 1,
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
        order: 2,
      },
      {
        key: 'organization',
        context: 'processes',
        label: 'Opgeladen door',
        category: 'Algemene informatie',
        isSortable: true,
        isDefault: true,
        order: 3,
      },
      {
        key: 'classification',
        context: 'processes',
        label: 'Relevant voor',
        category: 'Algemene informatie',
        isSortable: true,
        isDefault: true,
        order: 4,
      },
      {
        key: 'linkedConcept',
        context: 'processes',
        label: 'Gekoppeld aan inventaris',
        category: 'Link met procesinventaris',
        isDefault: true,
        order: 5,
      },
      {
        key: 'processCategory',
        context: 'processes',
        label: 'Procescategorie',
        category: 'Link met procesinventaris',
        isDefault: true,
        order: 6,
      },
      {
        key: 'modified',
        context: 'processes',
        label: 'Laatst aangepast op',
        category: 'Algemene informatie',
        isSortable: true,
        isDefault: true,
        order: 7,
      },
      {
        key: 'created',
        context: 'processes',
        label: 'Aangemaakt op',
        category: 'Algemene informatie',
        isSortable: true,
        order: 8,
      },
      {
        key: 'blueprint',
        context: 'processes',
        label: 'Blauwdruk',
        hintText:
          'Om plaats te besparen, wordt "Blauwdruk" als geel icoon getoond voor de titel.',
        category: 'Algemene informatie',
        iconFor: 'title',
        order: 9,
      },
      {
        key: 'creator',
        context: 'processes',
        label: 'Via leverancier',
        category: 'Algemene informatie',
        isSortable: true,
        order: 10,
      },
      {
        key: 'processGroup',
        context: 'processes',
        label: 'Procesgroep',
        category: 'Link met procesinventaris',
        order: 11,
      },
      {
        key: 'processDomain',
        context: 'processes',
        label: 'Procesdomein',
        category: 'Link met procesinventaris',
        order: 12,
      },
      {
        key: 'ipdcLpdcLink',
        context: 'processes',
        label: 'Link naar IPDC/LPDC',
        category: 'Algemene informatie',
        order: 13,
      },
      {
        key: 'usedBy',
        context: 'processes',
        label: 'In gebruik',
        hintText:
          'Om plaats te besparen, wordt "In gebruik" als pilletje getoond naast de titel.',
        category: 'Algemene informatie',
        iconFor: 'title',
        order: 14,
      },
      {
        key: 'professionalData',
        context: 'processes',
        label: 'Bevat professionele gegevens',
        category: 'Informatie Klasse Bepaling',
        order: 15,
      },
      {
        key: 'personalData',
        context: 'processes',
        label: 'Bevat persoonsgegevens',
        category: 'Informatie Klasse Bepaling',
        order: 16,
      },
      {
        key: 'specialPersonalData',
        context: 'processes',
        label: 'Bevat bijzondere persoonsgegevens',
        category: 'Informatie Klasse Bepaling',
        order: 17,
      },
      {
        key: 'availability',
        context: 'processes',
        label: 'Beschikbaarheid',
        category: 'Informatie Klasse Bepaling',
        order: 18,
      },
      {
        key: 'integrity',
        context: 'processes',
        label: 'Integriteit',
        category: 'Informatie Klasse Bepaling',
        order: 19,
      },
      {
        key: 'confidentiality',
        context: 'processes',
        label: 'Vertrouwelijkheid',
        category: 'Informatie Klasse Bepaling',
        order: 20,
      },
      {
        key: 'informationAsset',
        context: 'processes',
        label: 'Informatie-asset',
        category: 'Informatie Klasse Bepaling',
        order: 21,
      },
      {
        key: 'processEmail',
        context: 'processes',
        label: 'Emailadres proces',
        category: 'Algemene informatie',
        order: 22,
      },
      {
        key: 'authorityEmail',
        context: 'processes',
        label: 'Emailadres bestuur',
        category: 'Algemene informatie',
        order: 23,
      },
      {
        key: 'diagramCount',
        context: 'processes',
        label: 'Aantal diagrammen',
        category: 'Algemene informatie',
        order: 24,
      },
      {
        key: 'linkedBlueprint',
        context: 'processes',
        label: 'Gekoppeld aan blauwdruk',
        category: 'Algemene informatie',
        order: 25,
      },
    ];
  }
}
