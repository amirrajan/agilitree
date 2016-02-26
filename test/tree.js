//fswatch test/tree.js | xargs -n1 -I{} mocha --compilers js:babel-register

import { uniqueId } from 'lodash';
import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logUpdate,
  logCut,
  replay,
  getPrevious,
  getNext
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

describe('tree', function () {
  specify('add below', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var logs = logAdd([ ], row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logAddBelow(logs, row1.id, row3);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1 },
      { id: row3.id, text: row3.text, order: 2 },
      { id: row2.id, text: row2.text, order: 3 }
    ];

    areSame(
      replay(logs),
      expectedStructure);
  });

  specify('add above', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');
    var row3 = newRow('bar');

    var logs = logAdd([ ], row1);
    logs = logAddAbove(logs, row1.id, row2);
    logs = logAddAbove(logs, row1.id, row3);

    var expectedStructure = [
      { id: row2.id, text: row2.text, order: -1 },
      { id: row3.id, text: row3.text, order: 0 },
      { id: row1.id, text: row1.text, order: 1 }
    ];

    areSame(
      replay(logs),
      expectedStructure);
  });

  specify('update', function() {
    var row = newRow('root');

    var logs = logAdd([ ], row);

    logs = logUpdate(logs, row.id, 'say hello');

    var expectedStructure = [
      { id: row.id, text: 'say hello', order: 1 }
    ];

    areSame(
      replay(logs),
      expectedStructure);
  });


  specify('previous', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd([ ], row1);
    logs = logAddBelow(logs, row1.id, row2);

    var tree = replay(logs);

    var result = getPrevious(tree, row2.id).id;

    assert.equal(result, row1.id);
  });

  specify('next', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd([ ], row1);
    logs = logAddBelow(logs, row1.id, row2);

    var tree = replay(logs);

    var result = getNext(tree, row1.id).id;

    assert.equal(result, row2.id);
  });

  specify('delete', function() {
    var row1 = newRow('root');
    var row2 = newRow('foo');

    var logs = logAdd([ ], row1);
    logs = logAddBelow(logs, row1.id, row2);
    logs = logCut(logs, row2.id);

    var expectedStructure = [
      { id: row1.id, text: row1.text, order: 1 }
    ];

    areSame(
      replay(logs),
      expectedStructure);
  });
});
