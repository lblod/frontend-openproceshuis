import { helper } from '@ember/component/helper';

export default helper(function capitalizeFirst([string]) {
  if (typeof string !== 'string') return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
});
