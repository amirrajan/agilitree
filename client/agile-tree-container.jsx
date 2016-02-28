import { Component } from 'react';
import Guid from 'guid';

import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logAddRight,
  logUpdate,
  logCut,
  replay,
  getAbove,
  findRow,
  getBelow,
  getLeft,
  getFirstRightOf
} from './tree.js';

import { map, first, filter } from 'lodash';

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

    this.state = {
      logs,
      tree: replay(logs),
      currentlyEditing: null,
      currentlyFocused: first(replay(logs)).id
    };
  }

  setState(o) {
    super.setState(o);

    localStorage.setItem('logs', JSON.stringify(o.logs));
  }

  getLogsFromLocalStorage() {
    var logs = localStorage.getItem('logs');
    var firstId = Guid.raw();

    try {
      logs = JSON.parse(logs);

      if(logs.length == 0) {
        logs = [ ];
        logs = logAdd(logs, { id: firstId, text: 'root' });
      }
    } catch(e) {
      logs = [ ];
      logs = logAdd(logs, { id: firstId, text: 'root' });
    }

    if(!logs) {
      logs = [ ];
      logs = logAdd(logs, { id: firstId, text: 'root' });

      localStorage.setItem('logs', JSON.stringify(logs));
    }

    return logs;
  }

  edit(e) {
    e.preventDefault();
    this.setState({ currentlyEditing: this.state.currentlyFocused });
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
      var current = findRow(tree, currentlyFocused);

      if(current && current.text == '') return;

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
    if(row.parentId != null) this.setState({
      currentlyFocused: row.parentId,
      currentlyEditing: null
    });
    e.preventDefault();
  }

  cut(e) {
    if(this.state.tree.length == 1) return;

    var prevOrNextOrLeft = getAbove(
      this.state.tree,
      this.state.currentlyFocused);

    prevOrNextOrLeft = prevOrNextOrLeft || getBelow(
      this.state.tree,
      this.state.currentlyFocused);

    prevOrNextOrLeft = prevOrNextOrLeft || getLeft(
      this.state.tree,
      this.state.currentlyFocused);

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

  componentDidMount() {
    key('c', this.edit.bind(this));
    key('j', this.addSiblingOrMoveBelow.bind(this));
    key('k', this.addSiblingOrMoveAbove.bind(this));
    key('l', this.addChildOrRight.bind(this));
    key('h', this.left.bind(this));
    key('x', this.cut.bind(this));
  }

  render() {
    return (
      <div>
        <Tree
          uia='tree'
          tree={this.state.tree}
          save={this.save.bind(this)}
          currentlyFocused={this.state.currentlyFocused}
          currentlyEditing={this.state.currentlyEditing}
        />

        <div id="usage">
          Usage:

          <ul>
            <li>disable vimium if you use that chrome plugin (you won't need it)</li>
            <li>`j` to move down</li>
            <li>`k` to move up</li>
            <li>`l` to move right</li>
            <li>`h` to move left</li>
            <li>`c` to change entry</li>
            <li>`ESC` to save entry</li>
            <li>`x` to cut entry</li>
          </ul>
        </div>
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
