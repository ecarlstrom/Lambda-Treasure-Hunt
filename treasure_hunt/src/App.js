import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';

import GraphMap from './components/GraphMap';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Route exact path = '/' component = {GraphMap} />
      </div>
    );
  }
}

export default App;
