export function isArrayDiverging(
  currentItems = [],
  comparisonItems = [],
  propertiesToCheck,
) {
  if (currentItems.length !== comparisonItems.length) {
    return true;
  }

  return currentItems.some((item, index) => {
    return isDifferent(item, comparisonItems[index], propertiesToCheck);
  });
}

// NOTE: This is only checking on depth 0
function isDifferent(value, comparedValue, propertiesToCheck) {
  const propertiesToBeEqual =
    propertiesToCheck?.length >= 1 ? propertiesToCheck : ['id'];
  if (value === comparedValue) {
    return false;
  }

  const isValueAnObject = value && typeof value === 'object';
  const isComparedValueAnObject =
    comparedValue && typeof comparedValue === 'object';

  if (isValueAnObject && isComparedValueAnObject) {
    return propertiesToBeEqual.some(
      (prop) => value[prop] !== comparedValue[prop],
    );
  }

  return true;
}
