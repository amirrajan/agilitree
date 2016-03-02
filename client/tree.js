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

export function getSiblingAbove(table, id) {
  if(!findRow(table, id)) return null;

  var row = findRow(table, id);

  return last(sort(rowsAbove(table, row.order, row.parentId)));
}

export function getLastDeepest(tree, id) {
  var row = findRow(tree, id);

  if(!row) return null;

  var lastChild = last(rowsWithParentId(tree, id));

  if(!lastChild) return row;

  return getLastDeepest(tree, lastChild.id);
}

export function getAbove(tree, id) {
  var row = findRow(tree, id);

  if(!row) return null;

  var siblingAbove = getSiblingAbove(tree, id);

  if(siblingAbove) {
    return getLastDeepest(tree, siblingAbove.id);
  }

  return findRow(tree, row.parentId);
}

export function getSiblingBelow(table, id) {
  if(!findRow(table, id)) return null;

  var row = findRow(table, id);

  return first(sort(rowsBelow(table, row.order, row.parentId)));
}

function getHighestSiblingBelow(tree, id) {
  var row = findRow(tree, id);

  if(!row) return null;

  if(row.parentId == null) return getSiblingBelow(tree, row.id);

  var siblingBelowCurrent = getSiblingBelow(tree, row.id);

  if(siblingBelowCurrent) return siblingBelowCurrent;

  return getHighestSiblingBelow(tree, row.parentId);
}

export function getBelow(table, id) {
  if(!findRow(table, id)) return null;

  return first(rowsWithParentId(table, id)) ||
    getHighestSiblingBelow(table, findRow(table, id).id);
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
  if(!findRow(table, belowId)) return table;

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
  if(!findRow(table, aboveId)) return table;

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
  if(!findRow(table, id)) return table;

  findRow(table, id).text = text;

  return table;
}

export function del(table, id) {
  if(!findRow(table, id)) return table;

  var workingSet = split(table, id);
  each(workingSet.below, r => r.order -= 1);
  return sort(concat(workingSet.above, workingSet.below, workingSet.rest));
}

export function pasteBelow(table, belowId, row) {
  if(!row) return table;
  if(!findRow(table, belowId)) return table;

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

export function pasteAbove(table, aboveId, row) {
  if(!row) return table;
  if(!findRow(table, aboveId)) return table;

  var workingSet = split(table, aboveId);
  each(workingSet.below, r => r.order += 1);
  workingSet.on.order += 1;

  return sort(
    concat(
      combine(workingSet),
      newRow(
        row.id,
        row.text,
        workingSet.on.order - 1,
        workingSet.on.parentId)));
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

export function toggleMark(table, id) {
  var row = findRow(table, id);

  if(!row) return table;

  row.isMarked = !row.isMarked;

  return table;
}

export function replay(logs, startingTable = [ ]) {
  var clipBoard = null;
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
      clipBoard = findRow(startingTable, l.id);
      startingTable = del(startingTable, l.id);
    } else if (l.action == 'addRight') {
      startingTable = addRight(startingTable, l.rightOfId, l.row);
    } else if (l.action == 'pasteBelow') {
      startingTable = pasteBelow(startingTable, l.belowId, clipBoard);
      clipBoard = null;
    } else if (l.action == 'pasteAbove'){
      startingTable = pasteAbove(startingTable, l.aboveId, clipBoard);
      clipBoard = null;
    } else if (l.action == 'delete') {
      clipBoard = findRow(startingTable, l.id);
      startingTable = del(startingTable, l.id);
    } else if (l.action == 'toggleMark') {
      startingTable = toggleMark(startingTable, l.id);
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

export function logPasteBelow(logs, belowId) {
  return concat(logs, { action: 'pasteBelow', belowId });
}

export function logPasteAbove(logs, aboveId) {
  return concat(logs, { action: 'pasteAbove', aboveId });
}

export function logDelete(logs, id) {
  return concat(logs, { action: 'delete', id });
}

export function logToggleMark(logs, id) {
  return concat(logs, { action: 'toggleMark', id });
}
