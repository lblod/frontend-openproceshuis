import { helper } from '@ember/component/helper';

export default helper(function DateFormat([date]) {
  let parsedDate = date instanceof Date ? date : new Date(date);

  if (isNaN(parsedDate)) {
    return '';
  }

  const day = parsedDate.toLocaleDateString('nl-BE', { day: '2-digit' }),
    month = parsedDate.toLocaleDateString('nl-BE', { month: '2-digit' }),
    year = parsedDate.getFullYear();

  return day + '-' + month + '-' + year;
});
