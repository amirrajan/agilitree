//fswatch test/tree.js test/tree-children.js | xargs -n1 -I{} mocha --compilers js:babel-register

import { uniqueId } from 'lodash';
import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logUpdate,
  logCut,
  logDelete,
  replay,
  getAbove,
  getBelow,
  logPasteBelow,
  logPasteAbove,
  logToggleMark
} from '../client/tree.js';
import assert from 'assert';
import { fromJS } from 'immutable';

function areSame(l, r) {
  assert.ok(
    fromJS(l).equals(fromJS(r)),
    `${JSON.stringify(l, null, 2)} and ${JSON.stringify(r, null, 2)} are not equal.`);
}

function newRow(text) {
  return { id: uniqueId('tree'), text }
}

function initialState() {
  return [ ];
}

describe('tree', function () {
  specify('add below', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logAddBelow(logs, row1.id, row3);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row3.id, text: row3.text, order: 2, parentId: null },
      { id: row2.id, text: row2.text, order: 3, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('add above', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var logs = logAdd(initialState(), row1);
    logs = logAddAbove(logs, row1.id, row2);
    logs = logAddAbove(logs, row1.id, row3);

    var expectedStructure = [
      { id: row2.id, text: row2.text, order: -1, parentId: null  },
      { id: row3.id, text: row3.text, order: 0, parentId: null },
      { id: row1.id, text: row1.text, order: 1, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('update', function() {
    var row = newRow('root');

    var logs = logAdd(initialState(), row);

    logs = logUpdate(logs, row.id, 'say hello');

    var expectedStructure = [
      { id: row.id, text: 'say hello', order: 1, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('previous', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);

    var tree = replay(logs);

    var result = getAbove(tree, row2.id).id;

    assert.equal(result, row1.id);
  });

  specify('next', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);

    var tree = replay(logs);

    var result = getBelow(tree, row1.id).id;

    assert.equal(result, row2.id);
  });

  specify('cut', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logCut(logs, row2.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('delete', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logDelete(logs, row2.id);
    logs = logPasteBelow(logs, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row2.id, text: row2.text, order: 2, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('paste below', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logCut(logs, row2.id);
    logs = logPasteBelow(logs, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row2.id, text: row2.text, order: 2, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('paste above', function() {
    var row1 = newRow('item1');
    var row2 = newRow('item2');
    var row3 = newRow('item3');
    var row4 = newRow('item4');

    var logs = logAdd(initialState(), row1);
    logs = logAdd(logs, row2);
    logs = logAdd(logs, row3);
    logs = logAdd(logs, row4);
    logs = logCut(logs, row4.id);
    logs = logPasteAbove(logs, row1.id);

    var expectedStructure = [
      { id: row4.id, text: row4.text, order: -1, parentId: null },
      { id: row1.id, text: row1.text, order: 0, parentId: null },
      { id: row2.id, text: row2.text, order: 1, parentId: null },
      { id: row3.id, text: row3.text, order: 2, parentId: null },
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('paste multiple', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logAddBelow(logs, row2.id, row3);
    logs = logCut(logs, row2.id);
    logs = logCut(logs, row3.id);
    logs = logPasteBelow(logs, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row3.id, text: row3.text, order: 2, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);

    logs = logPasteBelow(logs, row1.id);

    areSame(replay(logs), expectedStructure);
  });

  specify('paste multiple above', function() {
    var row1 = newRow('1');
    var row2 = newRow('2');
    var row3 = newRow('3');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logAddBelow(logs, row2.id, row3);
    logs = logCut(logs, row2.id);
    logs = logCut(logs, row3.id);
    logs = logPasteAbove(logs, row1.id);

    var expectedStructure = [
      { id: row3.id, text: row3.text, order: -1, parentId: null },
      { id: row1.id, text: row1.text, order: 0, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);

    logs = logPasteAbove(logs, row1.id);

    areSame(replay(logs), expectedStructure);
  });

  specify('mark node', function() {
    var row1 = newRow('1');

    var logs = logAdd(initialState(), row1);
    logs = logToggleMark(logs, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, isMarked: true, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);

    logs = logToggleMark(logs, row1.id);

    expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, isMarked: false, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });
});
