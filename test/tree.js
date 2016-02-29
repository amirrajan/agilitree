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
  logPasteAbove
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
  return { logs: [ ], clipBoard: [ ] };
}

describe('tree', function () {
  specify('add below', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);
    state = logAddBelow(state, row1.id, row3);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row3.id, text: row3.text, order: 2, parentId: null },
      { id: row2.id, text: row2.text, order: 3, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });

  specify('add above', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var state = logAdd(initialState(), row1);
    state = logAddAbove(state, row1.id, row2);
    state = logAddAbove(state, row1.id, row3);

    var expectedStructure = [
      { id: row2.id, text: row2.text, order: -1, parentId: null  },
      { id: row3.id, text: row3.text, order: 0, parentId: null },
      { id: row1.id, text: row1.text, order: 1, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });

  specify('update', function() {
    var row = newRow('root');

    var state = logAdd(initialState(), row);

    state = logUpdate(state, row.id, 'say hello');

    var expectedStructure = [
      { id: row.id, text: 'say hello', order: 1, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });

  specify('previous', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);

    var tree = replay(state);

    var result = getAbove(tree, row2.id).id;

    assert.equal(result, row1.id);
  });

  specify('next', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);

    var tree = replay(state);

    var result = getBelow(tree, row1.id).id;

    assert.equal(result, row2.id);
  });

  specify('cut', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);
    state = logCut(state, row2.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });

  specify('delete', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);
    state = logDelete(state, row2.id);
    state = logPasteBelow(state, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });

  specify('paste below', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);
    state = logCut(state, row2.id);
    state = logPasteBelow(state, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row2.id, text: row2.text, order: 2, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });

  specify('paste multiple', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);
    state = logAddBelow(state, row2.id, row3);
    state = logCut(state, row2.id);
    state = logCut(state, row3.id);
    state = logPasteBelow(state, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row2.id, text: row2.text, order: 2, parentId: null },
      { id: row3.id, text: row3.text, order: 3, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });

  specify('paste multiple above', function() {
    var row1 = newRow('1');
    var row2 = newRow('2');
    var row3 = newRow('3');

    var state = logAdd(initialState(), row1);
    state = logAddBelow(state, row1.id, row2);
    state = logAddBelow(state, row2.id, row3);
    state = logCut(state, row2.id);
    state = logCut(state, row3.id);
    state = logPasteAbove(state, row1.id);

    var expectedStructure = [
      { id: row2.id, text: row2.text, order: -1, parentId: null },
      { id: row3.id, text: row3.text, order: 0, parentId: null },
      { id: row1.id, text: row1.text, order: 1, parentId: null }
    ];

    areSame(replay(state), expectedStructure);
  });
});
