export async function runInBatches(
  items,
  fn,
  { batchSize = 2, onBatch: onBatchCallback } = {},
) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => fn(item, i + batchIndex)),
    );
    await onBatchCallback?.(batchResults, i);
    results.push(...batchResults);
  }
  return results;
}
