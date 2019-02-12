import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';

import GraphMap from './components/GraphMap';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Test page, will add routes shortly
          </p>
        </header>
      </div>
    );
  }
}

export default App;
