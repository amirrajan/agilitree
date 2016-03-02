//fswatch test/tree.js test/tree-children.js test/bugs.js | xargs -n1 -I{} mocha --compilers js:babel-register

import { uniq, map } from 'lodash';
import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logAddRight,
  replay,
  getAbove,
  getSiblingAbove,
  getSiblingBelow,
  getRightOf,
  getFirstRightOf,
  top,
  bottom
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

function initialState() {
  return [ ];
}

describe('bugs', function () {
});
