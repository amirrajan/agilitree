import {
  each,
  filter,
  first,
  sortBy,
  last,
  concat
} from 'lodash';

function newRow(id, text, order) {
  return { id, text, order };
}

export function add(table, row) {
  return concat(
    table,
    newRow(
      row.id,
      row.text,
      table.length + 1));
}

export function findRow(table, id) {
  return first(filter(table, { id }));
}

function sort(table) { return sortBy(table, 'order'); }

function rowsAbove(table, order) {
  return filter(table, r => r.order < order)
}

function rowsBelow(table, order) {
  return filter(table, r => r.order > order)
}

export function getAbove(table, id) {
  return last(sort(rowsAbove(table, findRow(table, id).order)));
}

export function getBelow(table, id) {
  return first(sort(rowsBelow(table, findRow(table, id).order)));
}

export function split(table, onId) {
  var on = findRow(table, onId);

  return {
    above: rowsAbove(table, on.order),
    on,
    below: rowsBelow(table, on.order)
  };
}

export function combine(workingSet) {
  return concat(workingSet.above, workingSet.on, workingSet.below);
}

export function addBelow(table, belowId, row) {
  var workingSet = split(table, belowId);
  each(workingSet.below, r => r.order += 1);

  return sort(
    concat(
      combine(workingSet),
      newRow(
        row.id,
        row.text,
        workingSet.on.order + 1)));
}

export function addAbove(table, aboveId, row) {
  var workingSet = split(table, aboveId);
  each(workingSet.above, r => r.order -= 1);

  return sort(
    concat(
      combine(workingSet),
      newRow(row.id,
             row.text,
             workingSet.on.order - 1)));
}

export function update(table, id, text) {
  findRow(table, id).text = text;

  return table;
}

export function cut(table, id) {
  return filter(table, t => t.id != id);
}

export function addRight(table, rightOfId, row) {
  var results = add(table, row);
  var addedRow = findRow(results, row.id)
  addedRow.parentId = rightOfId;
  return results;
}

export function getRightOf(table, rightOfId) {
  return filter(table, { parentId: rightOfId});
}

export function replay(logs, startingTable = [ ]) {
  each(logs, l => {
    if(l.action == 'add') {
      startingTable = add(startingTable, l.row);
    } else if (l.action == 'addBelow') {
      startingTable = addBelow(startingTable, l.belowId, l.row);
    } else if (l.action == 'addAbove') {
      startingTable = addAbove(startingTable, l.aboveId, l.row);
    } else if (l.action == 'update') {
      startingTable = update(startingTable, l.id, l.text);
    } else if (l.action == 'cut') {
      startingTable = cut(startingTable, l.id);
    } else if (l.action == 'addRight') {
      startingTable = addRight(startingTable, l.rightOfId, l.row);
    }
  });

  return startingTable;
}

export function logAdd(logs, row) {
  return concat(logs, { action: 'add', row });
}

export function logAddBelow(logs, belowId, row) {
  return concat(logs, { action: 'addBelow', belowId, row });
}

export function logAddAbove(logs, aboveId, row) {
  return concat(logs, { action: 'addAbove', aboveId, row });
}

export function logUpdate(logs, id, text) {
  return concat(logs, { action: 'update', id, text });
}

export function logCut(logs, id) {
  return concat(logs, { action: 'cut', id });
}

export function logAddRight(logs, rightOfId, row) {
  return concat(logs, { action: 'addRight', rightOfId, row });
}
