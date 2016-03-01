import { Component } from 'react';
import Guid from 'guid';

import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logAddRight,
  logUpdate,
  logCut,
  logPasteBelow,
  replay,
  getAbove,
  findRow,
  getBelow,
  getLeft,
  getFirstRightOf,
  getRoot,
  top,
  bottom,
  logPasteAbove
} from './tree.js';

import { map, filter, difference, last } from 'lodash';

class TreeNode extends Component {
  getinitialState() {
    return { text: '' };
  }

  componentWillMount() {
    this.setState({ text: this.props.text });
  }

  saveOrNothing(e) {
    if(e.keyCode == 27 && this.props.text != this.state.text) {
      this.props.save(this.state.text);
    } else if(e.keyCode == 27) {
      this.setState({ text: this.props.text });
      this.props.save(this.props.text);
    } else if(e.keyCode == 219 && e.ctrlKey) {
      this.props.save(this.state.text);
    }
  }

  update(e) {
    this.setState({ text: e.target.value });
  }

  renderEditForm() {
    return (
      <li>
        <textarea
          autoFocus
          data-uia-todo
          type='text'
          placeholder='todo'
          rows='1'
          onKeyUp={this.saveOrNothing.bind(this)}
          onChange={this.update.bind(this)}
          value={this.state.text}
        />

        <Tree
          tree={this.props.tree}
          save={this.props.save}
          currentlyFocused={this.props.currentlyFocused}
          currentlyEditing={this.props.currentlyEditing}
          parentId={this.props.parentId}
        />
      </li>
    );
  }

  render() {
    if(this.props.editing) return this.renderEditForm();

    let className = 'unfocused';

    if(this.props.highlighted) className = 'currentlyFocused';

    return (
      <li className={className}>{this.props.text}
        <Tree
          tree={this.props.tree}
          save={this.props.save}
          currentlyFocused={this.props.currentlyFocused}
          currentlyEditing={this.props.currentlyEditing}
          parentId={this.props.parentId}
        />
      </li>
    );
  }
}

class Tree extends Component {
  render() {
    var parentId = this.props.parentId;
    var parents = [ ];

    if(!parentId) parents = filter(this.props.tree, t => !t.parentId);

    else parents = filter(this.props.tree, { parentId });

    if(parents.length == 0) return null;

    return (
      <ul data-uia={this.props.uia}>
        {map(parents,
          (v) => <TreeNode
                   key={v.id}
                   text={v.text}
                   tree={this.props.tree}
                   currentlyEditing={this.props.currentlyEditing}
                   currentlyFocused={this.props.currentlyFocused}
                   editing={v.id == this.props.currentlyEditing}
                   highlighted={v.id == this.props.currentlyFocused}
                   save={this.props.save}
                   parentId={v.id}
                 />)}
      </ul>
    );
  }
}

class AgileTreeContainer extends Component {
  constructor() {
    super();

    var logs = this.getLogsFromLocalStorage();

    var tree = replay(logs);

    this.state = {
      logs,
      tree,
      currentlyEditing: null,
      currentlyFocused: this.firstRootNode(tree)
    };
  }

  firstRootNode(tree) {
    return getRoot(tree).id;
  }

  setState(o) {
    super.setState(o);

    if(o.logs) localStorage.setItem('logs', JSON.stringify(o.logs));
  }

  defaultSetup(id) {
    return logAdd([ ], { id, text: 'root' });
  }

  getLogsFromLocalStorage() {
    var logs = localStorage.getItem('logs');
    var firstId = Guid.raw();

    try {
      logs = JSON.parse(logs);

      if(logs.length == 0) {
        logs = this.defaultSetup(firstId);
      }
    } catch(e) {
        logs = this.defaultSetup(firstId);
    }

    if(!logs) {
      logs = this.defaultSetup(firstId);

      localStorage.setItem('logs', JSON.stringify(logs));
    }

    return logs;
  }

  edit(e) {
    this.setState({ currentlyEditing: this.state.currentlyFocused });
    e.preventDefault();
  }

  addSiblingOrMoveBelow(e) {
    this.addOrSelect(e, getBelow, logAddBelow);
  }

  addSiblingOrMoveAbove(e) {
    this.addOrSelect(e, getAbove, logAddAbove);
  }

  addChildOrRight(e) {
    this.addOrSelect(e, getFirstRightOf, logAddRight);
  }

  root(e) {
    this.setState({
      currentlyFocused: this.firstRootNode(this.state.tree),
      currentlyEditing: null
    });

    e.preventDefault();
  }

  addSiblingAboveBelow(e) {
    var currentlyFocused = this.state.currentlyFocused;
    var newId = Guid.raw();
    var logs = this.state.logs;

    if(e.shiftKey) {
      logs = logAddAbove(
        logs,
        currentlyFocused,
        { id: newId, text: '' });
    } else {
      logs = logAddBelow(
        logs,
        currentlyFocused,
        { id: newId, text: '' });
    }

    this.setState({
      logs,
      tree: replay(logs),
      currentlyFocused: newId,
      currentlyEditing: newId
    });

    e.preventDefault();
  }

  addOrSelect(e, targetFunction, logFunction) {
    var currentlyFocused = this.state.currentlyFocused;
    var tree = this.state.tree;
    var target = targetFunction(tree, currentlyFocused);

    if(target) {
      this.setState({
        currentlyFocused: target.id,
        currentlyEditing: null
      });
    } else {
      var newId = Guid.raw();

      var logs = logFunction(
        this.state.logs,
        currentlyFocused,
        { id: newId, text: '' });

      this.setState({
        logs,
        tree: replay(logs),
        currentlyFocused: newId,
        currentlyEditing: null
      });
    }

    e.preventDefault();
  }

  left(e) {
    var row = findRow(this.state.tree, this.state.currentlyFocused);

    if(row.parentId != null) {
      this.setState({
        currentlyFocused: row.parentId,
        currentlyEditing: null
      });
    }

    e.preventDefault();
  }

  findClosest(tree, entry) {
    var prevOrNextOrLeft = getAbove(
      tree, entry);

    prevOrNextOrLeft = prevOrNextOrLeft || getBelow(
      tree, entry);

    prevOrNextOrLeft = prevOrNextOrLeft || getLeft(
      tree, entry);

    return prevOrNextOrLeft;
  }

  cut(e) {
    if(this.state.tree.length == 1) {
      e.preventDefault();
      return;
    }

    var prevOrNextOrLeft = this.findClosest(
      this.state.tree,
      this.state.currentlyFocused);

    if(!prevOrNextOrLeft) return;

    var logs = logCut(this.state.logs, this.state.currentlyFocused);

    this.setState({
      logs,
      tree: replay(logs),
      currentlyFocused: prevOrNextOrLeft.id,
      currentlyEditing: null
    });

    e.preventDefault();
  }

  save(newValue) {
    var logs = logUpdate(
      this.state.logs,
      this.state.currentlyEditing,
      newValue);

    this.setState({
      logs,
      tree: replay(logs),
      currentlyFocused: this.state.currentlyEditing,
      currentlyEditing: null
    });
  }

  topOrBottom(e) {
    var tree = this.state.tree;
    var currentlyFocused = this.state.currentlyFocused;

    if(e.shiftKey) {
      this.setState({
        currentlyFocused: bottom(tree, currentlyFocused).id
      });
    } else {
      this.setState({
        currentlyFocused: top(tree, currentlyFocused).id
      });
    }

    e.preventDefault();
  }

  pasteAboveOrBelow(e) {
    var currentlyFocused = this.state.currentlyFocused;
    var logs = this.state.logs;

    if(e.shiftKey) {
      logs = logPasteAbove(logs, currentlyFocused)
    } else {
      logs = logPasteBelow(logs, currentlyFocused);
    }

    this.setState({
      logs,
      tree: replay(logs)
    });

    e.preventDefault();
  }

  undo(e) {
    if(this.state.logs.length == 1) return;

    var logs = this.state.logs;
    var tree = this.state.tree;
    var editToRemove = last(this.state.logs);
    var newFocus = this.state.currentlyFocused;

    if(editToRemove.action == 'addBelow') {
      newFocus = getAbove(tree, newFocus).id;
    } else if(editToRemove.action == 'addAbove') {
      newFocus = getBelow(tree, newFocus).id;
    } else if(editToRemove.action == 'update') {
      newFocus = this.state.currentlyFocused;
    } else if(editToRemove.action == 'cut') {
      newFocus = editToRemove.id;
    } else if(editToRemove.action == 'addRight') {
      newFocus = getLeft(tree, newFocus).id;
    } else if(editToRemove.action == 'pasteBelow') {
      newFocus = this.state.currentlyFocused;
    } else if(editToRemove.action == 'pasteAbove') {
      newFocus = this.state.currentlyFocused;
    } else if(editToRemove.action == 'delete') {
      newFocus = editToRemove.id;
    } else {
      newFocus = null;
    }

    logs = difference(this.state.logs, [editToRemove]);
    tree = replay(logs);
    if (!newFocus) newFocus = this.firstRootNode(replay(logs));

    this.setState({
      logs,
      tree,
      currentlyFocused: newFocus
    });

    e.preventDefault();
  }

  componentDidMount() {
    key('c', this.edit.bind(this));
    key('i', this.edit.bind(this));
    key('j', this.addSiblingOrMoveBelow.bind(this));
    key('k', this.addSiblingOrMoveAbove.bind(this));
    key('l', this.addChildOrRight.bind(this));
    key('h', this.left.bind(this));
    key('x', this.cut.bind(this));
    key('d', this.cut.bind(this));
    key('o', this.addSiblingAboveBelow.bind(this));
    key('shift+o', this.addSiblingAboveBelow.bind(this));
    key('0', this.root.bind(this));
    key('g', this.topOrBottom.bind(this));
    key('shift+g', this.topOrBottom.bind(this));
    key('p', this.pasteAboveOrBelow.bind(this));
    key('shift+p', this.pasteAboveOrBelow.bind(this));
    key('u', this.undo.bind(this));
  }

  render() {
    return (
      <div>
        <h1>Agilitree - The Todo List for Vim Users</h1>

        <div>
          <ul>
            <li>
              chrome plugins: disable vimium for this page
            </li>
            <li>
              <code>k</code> to move up, <code>j</code> down, <code>l</code> to move right, <code>h</code> left<br />
            </li>
            <li>
              <code>0 (zero)</code> to move to the very top, <code>g</code> to move to top of current, <code>G</code> bottom of current
            </li>
            <li>
              <code>c or i</code> to change item, <code>esc or ctrl+[</code> to save
            </li>
            <li>
              <code>o</code> to insert below, <code>O</code> for above
            </li>
            <li>
              <code>x or d</code> to delete, <code>p</code> to paste below, <code>P</code> pastes above
            </li>
            <li>
              <code>console.log(localStorage['logs']);</code>
            </li>
            <li><a href="http://github.com/amirrajan/agilitree" target ="_blank">source on github</a></li>
          </ul>
        </div>

        <hr />

        <Tree
          uia='tree'
          tree={this.state.tree}
          save={this.save.bind(this)}
          currentlyFocused={this.state.currentlyFocused}
          currentlyEditing={this.state.currentlyEditing}
        />
      </div>
    );
  }
}

function initApp() {
  ReactDOM.render(
    <AgileTreeContainer />,
    document.getElementById('content')
  );
}

module.exports.initApp = initApp;
