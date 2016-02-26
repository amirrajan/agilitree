import { Component } from 'react';
import Guid from 'guid';

import {
  logAdd,
  logAddBelow,
  logAddAbove,
  logUpdate,
  logCut,
  replay,
  getPrevious,
  findRow,
  getNext
} from './tree.js';

import { map, first } from 'lodash';

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
      </li>
    );
  }

  render() {
    if(this.props.currentlyEditing) return this.renderEditForm();

    let className = 'unfocused';

    if(this.props.currentlyFocused) className = 'currentlyFocused';

    return <li className={className}>{this.props.text}</li>;
  }
}

class Tree extends Component {
  render() {
    return (
      <ul data-uia={this.props.uia}>
        {map(this.props.tree,
          (v) => <TreeNode
                   key={v.id}
                   text={v.text}
                   currentlyEditing={v.id == this.props.currentlyEditing}
                   currentlyFocused={v.id == this.props.currentlyFocused}
                   save={this.props.save}
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

  addSiblingOrNext(e) {
    this.addOrSelect(e, getNext, logAddBelow);
  }

  addSiblingOrPrevious(e) {
    this.addOrSelect(e, getPrevious, logAddAbove);
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

  cut() {
    if(this.state.tree.length == 1) return;

    var prevOrNext = getPrevious(
      this.state.tree,
      this.state.currentlyFocused);

    prevOrNext = prevOrNext || getNext(
      this.state.tree,
      this.state.currentlyFocused);

    var logs = logCut(this.state.logs, this.state.currentlyFocused);

    this.setState({
      logs,
      tree: replay(logs),
      currentlyFocused: prevOrNext.id,
      currentlyEditing: null
    });
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
    key('j', this.addSiblingOrNext.bind(this));
    key('k', this.addSiblingOrPrevious.bind(this));
    key('x', this.cut.bind(this));
  }

  render() {
    return (
      <Tree
        uia='tree'
        tree={this.state.tree}
        save={this.save.bind(this)}
        currentlyFocused={this.state.currentlyFocused}
        currentlyEditing={this.state.currentlyEditing}
      />
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
