// Ember native 'includes' helper doesn't work with proxy arrays so this helper fixes this issue
import { helper } from '@ember/component/helper';
export function contains([array, item]) {
  return array && array.includes(item);
}

export default helper(contains);
