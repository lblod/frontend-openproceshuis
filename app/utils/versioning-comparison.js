export function isArrayDiverging(currentItems = [], comparisonItems = []) {
  if (currentItems.length !== comparisonItems.length) {
    return true;
  }

  return currentItems.some((item, index) => {
    return isDifferent(item, comparisonItems[index]);
  });
}

function isDifferent(value, comparedValue) {
  return value !== comparedValue;
}
