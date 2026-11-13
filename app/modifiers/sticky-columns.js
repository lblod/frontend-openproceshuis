import { modifier } from 'ember-modifier';

const MAX_STICKY_COLUMNS = 6; // keep in sync with _c-advanced-table.scss
const OFFSET_PROPERTY = '--au-advanced-table-sticky-left-';

/**
 * Pins the first `count` columns of the table inside `element` to the left.
 *
 * CSS alone can only pin the first column: every following sticky column needs a
 * `left` offset equal to the summed width of the columns before it, and those
 * widths are determined by the content. So we measure the header cells and hand
 * the offsets to the stylesheet as custom properties, re-measuring whenever the
 * table resizes or its rows change.
 *
 * Everything is written onto the <table> element — never onto individual cells.
 * The header cells belong to AuDataTableThSortable, a classic component that
 * rewrites its own `class` attribute whenever its sort state recomputes, which
 * would drop any class we put there.
 */
export default modifier((element, [count = 0]) => {
  const table = element.querySelector('table');

  if (!table) {
    return;
  }

  const reset = () => {
    delete table.dataset.stickyColumns;

    for (let index = 1; index <= MAX_STICKY_COLUMNS; index++) {
      table.style.removeProperty(`${OFFSET_PROPERTY}${index}`);
    }
  };

  const apply = () => {
    // Un-pin everything first, so the measurement below reads the plain layout
    // position of each column rather than a position a previous run shifted.
    reset();

    const headerRow = table.rows[0];

    if (count < 1 || !headerRow) {
      return;
    }

    const stickyCount = Math.min(
      count,
      headerRow.cells.length,
      MAX_STICKY_COLUMNS,
    );

    // Offsets are differences between measured positions rather than a running
    // sum of widths: the table is `border-collapse: collapse`, so summing widths
    // double-counts every shared border.
    const origin = headerRow.cells[0].getBoundingClientRect().left;

    for (let index = 0; index < stickyCount; index++) {
      const left = headerRow.cells[index].getBoundingClientRect().left - origin;

      table.style.setProperty(`${OFFSET_PROPERTY}${index + 1}`, `${left}px`);
    }

    table.dataset.stickyColumns = stickyCount;
  };

  let frame = null;
  const scheduleApply = () => {
    if (frame) {
      return;
    }

    frame = requestAnimationFrame(() => {
      frame = null;
      apply();
    });
  };

  apply();

  const resizeObserver = new ResizeObserver(scheduleApply);
  resizeObserver.observe(table);

  // Rows and cell contents change as the model loads or the page changes.
  const mutationObserver = new MutationObserver(scheduleApply);
  mutationObserver.observe(table, { childList: true, subtree: true });

  return () => {
    resizeObserver.disconnect();
    mutationObserver.disconnect();

    if (frame) {
      cancelAnimationFrame(frame);
    }
  };
});
