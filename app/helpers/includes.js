import { helper } from '@ember/component/helper';

export default helper(function includes([item, array]) {
  return Array.isArray(array) && array.includes(item);
});
