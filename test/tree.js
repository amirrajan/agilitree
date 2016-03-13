//fswatch test/tree.js test/tree-children.js | xargs -n1 -I{} mocha --compilers js:babel-register

import { uniqueId } from 'lodash';
import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logAddRight,
  logUpdate,
  logCut,
  logDelete,
  replay,
  getAbove,
  getSiblingAbove,
  getBelow,
  logPasteBelow,
  logPasteAbove,
  logToggleMark,
  logToggleStrikeThrough
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

  describe('previous', function() {
    specify('just siblings', function() {
      var row1 = newRow('root');
      var row2 = newRow('foo');

      var logs = logAdd(initialState(), row1);
      logs = logAddBelow(logs, row1.id, row2);

      var tree = replay(logs);

      var result = getSiblingAbove(tree, row2.id).id;

      assert.equal(result, row1.id);
    });

    specify('siblings and children', function() {
      var item1 = newRow('item1');
      var item1child1 = newRow('item1/child1');
      var item1child2 = newRow('item1/child2');
      var item2 = newRow('item2');
      var item2child1 = newRow('item2/child1');
      var item2child2 = newRow('item2/child2');

      var logs = logAdd(initialState(), item1);
      logs = logAddRight(logs, item1.id, item1child1);
      logs = logAddRight(logs, item1.id, item1child2);
      logs = logAddBelow(logs, item1.id, item2);
      logs = logAddRight(logs, item2.id, item2child1);
      logs = logAddRight(logs, item2.id, item2child2);

      var tree = replay(logs);
      assert.equal(getAbove(tree, item1.id), null);
      assert.equal(getAbove(tree, item1child1.id).id, item1.id);
      assert.equal(getAbove(tree, item1child2.id).id, item1child1.id);
      assert.equal(getAbove(tree, item2.id).id, item1child2.id);
      assert.equal(getAbove(tree, item2child1.id).id, item2.id);
      assert.equal(getAbove(tree, item2child2.id).id, item2child1.id);
    });

    specify('nested children', function() {
      var item1 = newRow('item1');
      var item1child1 = newRow('item1/child1');
      var item1child1child1 = newRow('item1/child1/child1');
      var item2 = newRow('item2');

      var logs = logAdd(initialState(), item1);
      logs = logAddRight(logs, item1.id, item1child1);
      logs = logAddRight(logs, item1child1.id, item1child1child1);
      logs = logAddBelow(logs, item1.id, item2);

      var tree = replay(logs);

      assert.equal(getAbove(tree, item2.id).id, item1child1child1.id);
    })
  });

  describe('next', function() {
    specify('just siblings', function() {
      var row1 = newRow('root');
      var row2 = newRow('foo');

      var logs = logAdd(initialState(), row1);
      logs = logAddBelow(logs, row1.id, row2);

      var tree = replay(logs);

      var result = getBelow(tree, row1.id).id;

      assert.equal(result, row2.id);
    });

    specify('one siblings, one child', function() {
      var row1 = newRow('root');
      var row2 = newRow('root/child');

      var logs = logAdd(initialState(), row1);
      logs = logAddRight(logs, row1.id, row2);

      var tree = replay(logs);
      var result = getBelow(tree, row1.id).id;
      assert.equal(result, row2.id);
    });

    specify('siblings and children', function() {
      var item1 = newRow('item1');
      var item1child1 = newRow('item1/child1');
      var item1child2 = newRow('item1/child2');
      var item2 = newRow('item2');
      var item2child1 = newRow('item2/child1');
      var item2child2 = newRow('item2/child2');

      var logs = logAdd(initialState(), item1);
      logs = logAddRight(logs, item1.id, item1child1);
      logs = logAddRight(logs, item1.id, item1child2);
      logs = logAddBelow(logs, item1.id, item2);
      logs = logAddRight(logs, item2.id, item2child1);
      logs = logAddRight(logs, item2.id, item2child2);

      var tree = replay(logs);
      assert.equal(getBelow(tree, item1.id).id, item1child1.id);
      assert.equal(getBelow(tree, item1child1.id).id, item1child2.id);
      assert.equal(getBelow(tree, item1child2.id).id, item2.id);
      assert.equal(getBelow(tree, item2.id).id, item2child1.id);
      assert.equal(getBelow(tree, item2child1.id).id, item2child2.id);
      assert.equal(getBelow(tree, item2child2.id), null);
    });

    specify('nested children', function() {
      var item1 = newRow('item1');
      var item1child1 = newRow('item1/child1');
      var item1child1child1 = newRow('item1/child2/child1');
      var item2 = newRow('item2');

      var logs = logAdd(initialState(), item1);
      logs = logAddRight(logs, item1.id, item1child1);
      logs = logAddRight(logs, item1child1.id, item1child1child1);
      logs = logAddBelow(logs, item1.id, item2);

      var tree = replay(logs);

      assert.equal(getBelow(tree, item1child1child1.id).id, item2.id);
    })
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
    var item1 = newRow('item1');
    var item2 = newRow('item2');
    var item3 = newRow('item3');
    var item4 = newRow('item4');
    var item5 = newRow('item5');

    var logs = logAdd(initialState(), item1);
    logs = logAddBelow(logs, item1.id, item2);
    logs = logAddBelow(logs, item2.id, item3);
    logs = logAddBelow(logs, item3.id, item4);
    logs = logAddBelow(logs, item4.id, item5);
    logs = logCut(logs, item5.id);
    logs = logPasteBelow(logs, item2.id);

    var expectedStructure = [
      { id: item1.id, text: item1.text, order: 1, parentId: null },
      { id: item2.id, text: item2.text, order: 2, parentId: null },
      { id: item5.id, text: item5.text, order: 3, parentId: null },
      { id: item3.id, text: item3.text, order: 4, parentId: null },
      { id: item4.id, text: item4.text, order: 5, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('paste above', function() {
    var item1 = newRow('item1');
    var item2 = newRow('item2');
    var item3 = newRow('item3');
    var item4 = newRow('item4');
    var item5 = newRow('item5');

    var logs = logAdd(initialState(), item1);
    logs = logAddBelow(logs, item1.id, item2);
    logs = logAddBelow(logs, item2.id, item3);
    logs = logAddBelow(logs, item3.id, item4);
    logs = logAddBelow(logs, item4.id, item5);
    logs = logCut(logs, item5.id);
    logs = logPasteAbove(logs, item3.id);

    var expectedStructure = [
      { id: item1.id, text: item1.text, order: 1, parentId: null },
      { id: item2.id, text: item2.text, order: 2, parentId: null },
      { id: item5.id, text: item5.text, order: 3, parentId: null },
      { id: item3.id, text: item3.text, order: 4, parentId: null },
      { id: item4.id, text: item4.text, order: 5, parentId: null }
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
      { id: row3.id, text: row3.text, order: 1, parentId: null },
      { id: row1.id, text: row1.text, order: 2, parentId: null }
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

  specify('cut retains mark after paste below', function() {
    var row1 = newRow('1');
    var row2 = newRow('1');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logToggleMark(logs, row2.id);
    logs = logCut(logs, row2.id);
    logs = logPasteBelow(logs, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row2.id, text: row2.text, order: 2, isMarked: true, parentId: null },
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('cut retains mark after paste above', function() {
    var row1 = newRow('1');
    var row2 = newRow('1');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logToggleMark(logs, row2.id);
    logs = logCut(logs, row2.id);
    logs = logPasteAbove(logs, row1.id);

    var expectedStructure = [
      { id: row2.id, text: row2.text, order: 1, isMarked: true, parentId: null },
      { id: row1.id, text: row1.text, order: 2, parentId: null }
    ];

    areSame(replay(logs), expectedStructure);
  });

  specify('cut retains strike through node', function() {
    var row1 = newRow('1');
    var row2 = newRow('1');

    var logs = logAdd(initialState(), row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logToggleStrikeThrough(logs, row2.id);
    logs = logCut(logs, row2.id);
    logs = logPasteBelow(logs, row1.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row2.id, text: row2.text, order: 2, isStrikedThrough: true, parentId: null },
    ];

    areSame(replay(logs), expectedStructure);
  });
});
