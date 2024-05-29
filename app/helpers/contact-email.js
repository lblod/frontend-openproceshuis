import { helper } from '@ember/component/helper';
import { findPrimaryContact } from '../models/contact-point';

export default helper(function contactEmail([contactList]) {
  return findPrimaryContact(contactList)?.email;
});
