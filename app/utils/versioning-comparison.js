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

export function removedItemsWhenPropertyEquals(_array, property, value) {
  return _array.filter((item) => {
    if (!(property in item)) {
      return true;
    }
    return item[property] !== value;
  });
}

export function getCalculatedDifferences(
  currentItems = [],
  comparisonItems = [],
  propertiesToCheck,
) {
  let _added = 0;
  let _removed = 0;

  const propertiesToBeEqual =
    propertiesToCheck?.length >= 1 ? propertiesToCheck : ['id'];

  const compared = mapArrayForProperties(
    [...(comparisonItems ?? [])],
    propertiesToBeEqual,
  );
  const current = mapArrayForProperties(
    [...(currentItems ?? [])],
    propertiesToBeEqual,
  );

  if (!isArrayDiverging(current, compared)) {
    return {
      added: 0,
      removed: 0,
    };
  }

  const handledCurrentItemIds = [];
  for (const currentItem of current) {
    if (handledCurrentItemIds.includes(currentItem.id)) {
      continue;
    }

    handledCurrentItemIds.push(currentItem.id);
    const comparedValue = compared.find(
      (compared) => compared?.id === currentItem?.id,
    );
    if (!comparedValue) {
      _added++;
    }
    if (comparedValue && isDifferent(currentItem, comparedValue)) {
      _removed++;
    }
  }

  const handledComparedItemIds = [];
  for (const comparedItem of compared) {
    if (handledComparedItemIds.includes(comparedItem.id)) {
      continue;
    }

    handledComparedItemIds.push(comparedItem.id);
    const currentValue = current.find(
      (current) => current?.id === comparedItem?.id,
    );
    if (!currentValue) {
      _removed++;
    }
  }

  return {
    added: _added ?? 0,
    removed: _removed ?? 0,
  };
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

function mapArrayForProperties(_array, propertiesToCheck) {
  if (!_array || _array.length === 0) {
    return [];
  }

  return _array.map((objectOrOther) => {
    if (
      typeof objectOrOther !== 'object' ||
      !propertiesToCheck ||
      propertiesToCheck.length === 0
    ) {
      return objectOrOther;
    }

    const simpleObject = {};
    for (const property of propertiesToCheck) {
      simpleObject[property] = objectOrOther[property];
    }

    return simpleObject;
  });
}
