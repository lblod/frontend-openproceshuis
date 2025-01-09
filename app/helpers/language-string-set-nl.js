import { helper } from '@ember/component/helper';

export default helper(function languageStringSetNl([langStringSet]) {
  if (!langStringSet?.length) return undefined;

  return (
    langStringSet.find((langString) => langString.language === 'nl')?.content ??
    langStringSet.find((langString) => langString.language.startsWith('nl'))
      ?.content ??
    langStringSet[0].content
  );
});
