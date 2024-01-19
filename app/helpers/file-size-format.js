import { helper } from '@ember/component/helper';

export default helper(function fileSizeFormat([size]) {
  if (isNaN(size)) return '';

  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB'];
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
});
