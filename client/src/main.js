/**
 * App entry point
 */

// Polyfill
import 'babel-polyfill';

// Libraries
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, browserHistory} from 'react-router';

// Routes
import Routes from './common/components/Routes';

// Base styling
import './common/base.css';

ReactDOM.render((
  <Router history={browserHistory}>
    {Routes}
  </Router>
), document.getElementById('app'));
