'use strict';

module.exports = {
  singleQuote: true,
  overrides: [
    {
      files: '*.hbs',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.{js,ts}',
      options: {
        singleQuote: true,
      },
    },
  ],
};
