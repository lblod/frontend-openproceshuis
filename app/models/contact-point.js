import Model, { attr } from '@ember-data/model';
export const CONTACT_TYPE = {
  PRIMARY: 'Primary',
  SECONDARY: 'Secondary',
};

export default class ContactPointModel extends Model {
  @attr email;
  @attr telephone;
  @attr fax;
  @attr website;
  @attr type;
}

export function findPrimaryContact(contactList) {
  return contactList?.find((contact) => contact.type === CONTACT_TYPE.PRIMARY);
}

export function findSecondaryContact(contactList) {
  return contactList?.find(
    (contact) => contact.type === CONTACT_TYPE.SECONDARY
  );
}
