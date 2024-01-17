'use strict';

module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-prettier/recommended'],
  rules: {
    'selector-class-pattern': null, // This enforces kebab-case but we use BEM which isn't compatible
    'at-rule-no-unknown': null,
    'no-descending-specificity': null,
    'annotation-no-unknown': null,
    'import-notation': null,
    'function-no-unknown': null,
  },
};
