//fswatch test/tree.js test/tree-children.js | xargs -n1 -I{} mocha --compilers js:babel-register

import { uniqueId } from 'lodash';
import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logAddRight,
  replay,
  getAbove,
  getBelow,
  getRightOf,
  getFirstRightOf
} from '../client/tree.js';
import assert from 'assert';
import { fromJS } from 'immutable';
import Guid from 'guid';

function areSame(l, r) {
  assert.ok(
    fromJS(l).equals(fromJS(r)),
    `${JSON.stringify(l, null, 2)} and ${JSON.stringify(r, null, 2)} are not equal.`);
}

function newRow(text) {
  return { id: uniqueId(Guid.raw().substring(0, 8)), text }
}

describe('tree children', function () {
  specify('adding children', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd([ ], row1);
    logs = logAddRight(logs, row1.id, row2);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1, parentId: null },
      { id: row2.id, text: row2.text, order: 1, parentId: row1.id }
    ];

    var tree = replay(logs);
    areSame(tree, expectedStructure);

    var right = getRightOf(tree, row1.id);

    var expectedRight = [
      { id: row2.id, text: row2.text, order: 1, parentId: row1.id }
    ];

    areSame(right, expectedRight);

    var firstRight = getFirstRightOf(tree, row1.id);
    var expectedFirstRight = {
      id: row2.id,
      text: row2.text,
      order: 1,
      parentId: row1.id
    };

    areSame(firstRight, expectedFirstRight);
  });

  describe('adding multiple children', function() {
    var row1 = newRow('root');
    var row2 = newRow('./root/child');
    var row3 = newRow('./root/child2');
    var row4 = newRow('./root/child3');

    specify('right', function() {
      var logs = logAdd([ ], row1);
      logs = logAddRight(logs, row1.id, row2);
      logs = logAddRight(logs, row1.id, row3);
      logs = logAddRight(logs, row1.id, row4);

      var tree = replay(logs);
      assert.equal(getAbove(tree, row4.id).id, row3.id);
      assert.equal(getAbove(tree, row3.id).id, row2.id);
      assert.equal(getAbove(tree, row2.id), null);
    });

    specify('below', function() {
      var logs = logAdd([ ], row1);
      logs = logAddRight(logs, row1.id, row2);
      logs = logAddBelow(logs, row2.id, row3);
      logs = logAddBelow(logs, row3.id, row4);

      var tree = replay(logs);
      assert.equal(getAbove(tree, row4.id).id, row3.id);
      assert.equal(getAbove(tree, row3.id).id, row2.id);
      assert.equal(getAbove(tree, row2.id), null);
    });

    specify('above', function() {
      var logs = logAdd([ ], row1);
      logs = logAddRight(logs, row1.id, row4);
      logs = logAddAbove(logs, row4.id, row3);
      logs = logAddAbove(logs, row3.id, row2);

      var tree = replay(logs);
      assert.equal(getAbove(tree, row4.id).id, row3.id);
      assert.equal(getAbove(tree, row3.id).id, row2.id);
      assert.equal(getAbove(tree, row2.id), null);
    });
  });

  specify('previous for parent with children', function() {
    var row1 = newRow('./root');
    var row2 = newRow('./root/child');
    var row3 = newRow('./root/child2');
    var row4 = newRow('./foo');

    var logs = logAdd([ ], row1);
    logs = logAddBelow(logs, row1.id, row4);
    logs = logAddRight(logs, row1.id, row2);
    logs = logAddBelow(logs, row2.id, row3);

    var tree = replay(logs);
    assert.equal(getAbove(tree, row1.id), null);
    assert.equal(getAbove(tree, row2.id), null);
    assert.equal(getAbove(tree, row3.id).id, row2.id);
    assert.equal(getAbove(tree, row4.id).id, row1.id);
  });

  specify('next for parent with children', function() {
    var row1 = newRow('./root');
    var row2 = newRow('./root/child');
    var row3 = newRow('./root/child2');
    var row4 = newRow('./foo');

    var logs = logAdd([ ], row1);
    logs = logAddBelow(logs, row1.id, row4);
    logs = logAddRight(logs, row1.id, row2);
    logs = logAddBelow(logs, row2.id, row3);

    var tree = replay(logs);
    assert.equal(getBelow(tree, row1.id).id, row4.id);
    assert.equal(getBelow(tree, row2.id).id, row3.id);
    assert.equal(getBelow(tree, row3.id), null);
    assert.equal(getBelow(tree, row4.id), null);
  });
});
