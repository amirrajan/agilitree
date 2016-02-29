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
  logDelete,
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

    var appState = {
      logs,
      clipBoard: [ ]
    };

    var tree = replay(appState);

    this.state = {
      appState,
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

    if(o.appState && o.appState.logs) localStorage.setItem('logs', JSON.stringify(o.appState.logs));
  }

  defaultSetup(id) {
    return logAdd([ ], { id, text: 'root' }).logs;
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
    var appState = this.state.appState;

    if(e.shiftKey) {
      appState = logAddAbove(
        appState,
        currentlyFocused,
        { id: newId, text: '' });
    } else {
      appState = logAddBelow(
        appState,
        currentlyFocused,
        { id: newId, text: '' });
    }

    this.setState({
      appState,
      tree: replay(appState),
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

      var appState = logFunction(
        this.state.appState,
        currentlyFocused,
        { id: newId, text: '' });

      this.setState({
        appState,
        tree: replay(appState),
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

  cut(e) {
    if(this.state.tree.length == 1) {
      e.preventDefault();
      return;
    }

    var prevOrNextOrLeft = getAbove(
      this.state.tree,
      this.state.currentlyFocused);

    prevOrNextOrLeft = prevOrNextOrLeft || getBelow(
      this.state.tree,
      this.state.currentlyFocused);

    prevOrNextOrLeft = prevOrNextOrLeft || getLeft(
      this.state.tree,
      this.state.currentlyFocused);

    if(!prevOrNextOrLeft) return;

    var appState = logCut(this.state.appState, this.state.currentlyFocused);

    this.setState({
      appState,
      tree: replay(appState),
      currentlyFocused: prevOrNextOrLeft.id,
      currentlyEditing: null
    });

    e.preventDefault();
  }

  delete(e) {
    if(this.state.tree.length == 1) {
      e.preventDefault();
      return;
    }

    var prevOrNextOrLeft = getAbove(
      this.state.tree,
      this.state.currentlyFocused);

    prevOrNextOrLeft = prevOrNextOrLeft || getBelow(
      this.state.tree,
      this.state.currentlyFocused);

    prevOrNextOrLeft = prevOrNextOrLeft || getLeft(
      this.state.tree,
      this.state.currentlyFocused);

    if(!prevOrNextOrLeft) return;

    var appState = logDelete(this.state.appState, this.state.currentlyFocused);

    this.setState({
      appState,
      tree: replay(appState),
      currentlyFocused: prevOrNextOrLeft.id,
      currentlyEditing: null
    });

    e.preventDefault();
  }

  save(newValue) {
    var appState = logUpdate(
      this.state.appState,
      this.state.currentlyEditing,
      newValue);

    this.setState({
      appState,
      tree: replay(appState),
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
    var appState = this.state.appState;

    if(e.shiftKey) {
      appState = logPasteAbove(appState, currentlyFocused)
    } else {
      appState = logPasteBelow(appState, currentlyFocused);
    }

    this.setState({
      appState,
      tree: replay(appState)
    });

    e.preventDefault();
  }

  undo(e) {
    debugger;
    if(this.state.appState.logs.length == 1) return;

    var appState = this.state.appState;
    var logs = difference(this.state.appState.logs, [last(this.state.appState.logs)]);

    appState.logs = logs;

    this.setState({
      appState,
      tree: replay(appState)
    });

    this.root(e);
  }

  componentDidMount() {
    key('c', this.edit.bind(this));
    key('i', this.edit.bind(this));
    key('j', this.addSiblingOrMoveBelow.bind(this));
    key('k', this.addSiblingOrMoveAbove.bind(this));
    key('l', this.addChildOrRight.bind(this));
    key('h', this.left.bind(this));
    key('x', this.cut.bind(this));
    key('d', this.delete.bind(this));
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
              <code>c or i</code> to change item, <code>esc</code> to save
            </li>
            <li>
              <code>o</code> to insert below, <code>O</code> for above
            </li>
            <li>
              <code>x</code> to cut, <code>p</code> to paste below, <code>P</code> pastes above
            </li>
            <li>
              <code>d</code> to delete, <code>u</code> to undo
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
