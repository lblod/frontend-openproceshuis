import { helper } from '@ember/component/helper';

export default helper(function DateFormat([date, includeTime]) {
  let parsedDate = date instanceof Date ? date : new Date(date);

  if (isNaN(parsedDate)) {
    return '';
  }

  const locale = 'nl-BE';

  const day = parsedDate.toLocaleDateString(locale, { day: '2-digit' }),
    month = parsedDate.toLocaleDateString(locale, { month: '2-digit' }),
    year = parsedDate.toLocaleDateString(locale, { year: 'numeric' });

  let result = `${day}-${month}-${year}`;

  if (includeTime) {
    const time = parsedDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    result += ` ${time}`;
  }

  return result;
});
