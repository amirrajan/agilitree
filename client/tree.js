import {
  each,
  filter,
  first,
  sortBy,
  last,
  concat,
  difference,
  reverse
} from 'lodash';

function newRow(id, text, order, parentId) {
  return { id, text, order, parentId };
}

export function add(table, row) {
  var table = table;

  table = concat(
    table,
    newRow(
      row.id,
      row.text,
      row.order || table.length + 1,
      row.parentId || null));

  return table;
}

export function findRow(table, id) {
  return first(filter(table, { id }));
}

function sort(table) { return sortBy(table, 'order'); }

function rowsAbove(table, order, parentId) {
  return filter(
    rowsWithParentId(table, parentId),
    r => r.order < order);
}

function rowsBelow(table, order, parentId) {
  return filter(
    rowsWithParentId(table, parentId),
    r => r.order > order);
}

function rowsWithParentId(table, parentId) {
  return filter(table, r => r.parentId == parentId);
}

export function getAbove(table, id) {
  var row = findRow(table, id);

  return last(sort(rowsAbove(table, row.order, row.parentId)));
}

export function getBelow(table, id) {
  var row = findRow(table, id);

  return first(sort(rowsBelow(table, row.order, row.parentId)));
}

export function getLeft(table, id) {
  var row = findRow(table, id);

  if(!row.parentId) return null;

  return findRow(table, row.parentId);
}

export function getRoot(table) {
  return first(filter(table, r => !r.parentId));
}

export function top(table, reference) {
  return first(
    sort(rowsWithParentId(table, findRow(table, reference).parentId)));
}

export function bottom(table, reference) {
  return last(
    sort(rowsWithParentId(table, findRow(table, reference).parentId)));
}

export function split(table, onId) {
  var on = findRow(table, onId);
  var above = rowsAbove(table, on.order);
  var below = rowsBelow(table, on.order);
  var rest = difference(table, concat(above, on, below));

  return { above, on, below, rest };
}

export function combine(workingSet) {
  return concat(
    workingSet.above,
    workingSet.on,
    workingSet.below,
    workingSet.rest);
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
        workingSet.on.order + 1,
        workingSet.on.parentId)));
}

export function addAbove(table, aboveId, row) {
  var workingSet = split(table, aboveId);
  each(workingSet.above, r => r.order -= 1);

  return sort(
    concat(
      combine(workingSet),
      newRow(row.id,
             row.text,
             workingSet.on.order - 1,
             workingSet.on.parentId)));
}

export function update(table, id, text) {
  findRow(table, id).text = text;

  return table;
}

export function del(table, id) {
  return filter(table, t => t.id != id);
}

export function pasteBelow(table, belowId, rows) {
  var tempTable = table;

  each(reverse(rows), row => {
    var workingSet = split(tempTable, belowId);
    each(workingSet.below, r => r.order += 1);

    tempTable = sort(
      concat(
        combine(workingSet),
        newRow(
          row.id,
          row.text,
          workingSet.on.order + 1,
          workingSet.on.parentId)));
  });

  return tempTable;
}

export function pasteAbove(table, belowId, rows) {
  var tempTable = table;

  each(reverse(rows), (row, index) => {
    var workingSet = split(tempTable, belowId);
    each(workingSet.below, r => r.order -= 1);

    tempTable = sort(
      concat(
        combine(workingSet),
        newRow(
          row.id,
          row.text,
          workingSet.on.order - (index + 1),
          workingSet.on.parentId)));
  });

  return tempTable;
}

export function addRight(table, rightOfId, row) {
  row.order = rowsWithParentId(table, rightOfId).length + 1;
  row.parentId = rightOfId
  return add(table, row);
}

export function getRightOf(table, rightOfId) {
  return filter(table, { parentId: rightOfId});
}

export function getFirstRightOf(table, rightOfId) {
  return first(getRightOf(table, rightOfId));
}

export function replay(state, startingTable = [ ]) {
  var clipBoard = [];
  each(state.logs, l => {
    if(l.action == 'add') {
      startingTable = add(startingTable, l.row);
    } else if (l.action == 'addBelow') {
      startingTable = addBelow(startingTable, l.belowId, l.row);
    } else if (l.action == 'addAbove') {
      startingTable = addAbove(startingTable, l.aboveId, l.row);
    } else if (l.action == 'update') {
      startingTable = update(startingTable, l.id, l.text);
    } else if (l.action == 'cut') {
      clipBoard.push(findRow(startingTable, l.id));
      startingTable = del(startingTable, l.id);
    } else if (l.action == 'addRight') {
      startingTable = addRight(startingTable, l.rightOfId, l.row);
    } else if (l.action == 'pasteBelow') {
      startingTable = pasteBelow(startingTable, l.belowId, clipBoard);
      clipBoard = [];
    } else if (l.action == 'pasteAbove'){
      startingTable = pasteAbove(startingTable, l.belowId, clipBoard);
      clipBoard = [];
    } else if (l.action == 'delete') {
      startingTable = del(startingTable, l.id);
    }
  });

  return startingTable;
}

export function logAdd(state, row) {
  state.logs = concat(state.logs, { action: 'add', row });
  return state;
}

export function logAddBelow(state, belowId, row) {
  state.logs = concat(state.logs, { action: 'addBelow', belowId, row });
  return state;
}

export function logAddAbove(state, aboveId, row) {
  state.logs = concat(state.logs, { action: 'addAbove', aboveId, row });
  return state;
}

export function logUpdate(state, id, text) {
  state.logs = concat(state.logs, { action: 'update', id, text });
  return state;
}

export function logCut(state, id) {
  state.logs = concat(state.logs, { action: 'cut', id });
  return state;
}

export function logAddRight(state, rightOfId, row) {
  state.logs = concat(state.logs, { action: 'addRight', rightOfId, row });
  return state;
}

export function logPasteBelow(state, belowId) {
  state.logs = concat(state.logs, { action: 'pasteBelow', belowId });
  return state;
}

export function logPasteAbove(state, belowId) {
  state.logs = concat(state.logs, { action: 'pasteAbove', belowId });
  return state;
}

export function logDelete(state, id) {
  state.logs = concat(state.logs, { action: 'delete', id });
  return state;
}
