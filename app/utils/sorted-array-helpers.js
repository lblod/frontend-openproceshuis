/*
 * sorted-array-helpers.js
 *
 * Efficient helper functions for working with sorted arrays of objects using binary search.
 */

/**
 * @private
 * Normalize a value for comparison, optionally converting strings to lowercase.
 * @param {*} value - The value to normalize.
 * @param {boolean} ignoreCase - Whether to ignore case for string values.
 * @returns {*} Normalized comparison value.
 */
function normalize(value, ignoreCase) {
  return ignoreCase && typeof value === 'string' ? value.toLowerCase() : value;
}

/**
 * Finds the index of an object with a given property value in a sorted array.
 * @param {Object[]} arr - Sorted array of objects.
 * @param {string} value - Target value to search for.
 * @param {string} key - Property name used for comparison.
 * @param {boolean} [ignoreCase=false] - Whether to ignore case when comparing strings.
 * @returns {number} Index of the matching object, or -1 if not found.
 */
export function sortedIndexOf(arr, value, key, ignoreCase = false) {
  let low = 0;
  let high = arr.length - 1;
  const target = normalize(value, ignoreCase);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = normalize(arr[mid][key], ignoreCase);

    if (midVal === target) return mid;
    if (midVal < target) low = mid + 1;
    else high = mid - 1;
  }

  return -1;
}

/**
 * Checks if a sorted array of objects contains an object with a specified property value.
 * @param {Object[]} arr - Sorted array of objects.
 * @param {string} value - Target value to search for.
 * @param {string} key - Property name used for comparison.
 * @param {boolean} [ignoreCase=false] - Whether to ignore case when comparing strings.
 * @returns {boolean} True if found, otherwise false.
 */
export function sortedIncludes(arr, value, key, ignoreCase = false) {
  return sortedIndexOf(arr, value, key, ignoreCase) !== -1;
}

/**
 * Inserts an object into a sorted array of objects while maintaining sorted order.
 * @param {Object[]} arr - Sorted array of objects.
 * @param {Object} newItem - New object to insert.
 * @param {string} key - Property name used for sorting.
 * @param {boolean} [ignoreCase=false] - Whether to ignore case when comparing strings.
 * @returns {Object[]} The modified array (same reference).
 * @throws {Error} If key is not provided.
 */
export function sortedInsert(arr, newItem, key, ignoreCase = false) {
  if (!key)
    throw new Error('A key must be provided to determine the sort order.');

  const targetValue = normalize(newItem[key], ignoreCase);
  let low = 0;
  let high = arr.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = normalize(arr[mid][key], ignoreCase);

    if (midVal < targetValue) low = mid + 1;
    else high = mid;
  }

  arr.splice(low, 0, newItem);
  return arr;
}
