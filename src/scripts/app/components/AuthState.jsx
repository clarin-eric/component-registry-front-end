'use strict';
var log = require('loglevel');

// React
var React = require('react');

// Config
var getConfiguration = require('../../config');

//Bootstrap
var Glyphicon = require('react-bootstrap/lib/Glyphicon');

// Mixins
var ImmutableRenderMixin = require('react-immutable-render-mixin');

/**
* AuthState - shows login state and options to perform related actions
* @constructor
*/
var AuthState = React.createClass({
  mixins: [ImmutableRenderMixin],

  propTypes: {
    authState: React.PropTypes.object.isRequired,
    history: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  },

  render: function () {
    var config = getConfiguration();
    var adminUrl = config.adminUrl;
    var restUrl = config.restUrl;
    var authUrl = restUrl + "/authentication"

    var authState = this.props.authState;

    var helpLink = (
      <a target="_blank" href={Config.webappUrl + "/documentation.jsp"}><Glyphicon glyph="question-sign" />&nbsp;help</a>
    );

    if(authState.authenticated) {
      return (
        <div className="auth-logged-in">
          <Glyphicon glyph="user" />&nbsp;{authState.displayName}
          &nbsp;
          <a href={adminUrl + "/userSettings"} target="_blank"><Glyphicon glyph="cog" />&nbsp;settings</a>
          &nbsp;
          {helpLink}
          &nbsp;
          {authState.isAdmin ? (
            <a href={adminUrl + "/"} target="_blank"><Glyphicon glyph="wrench" />&nbsp;admin</a>
          ) : null}
        </div>
      );
    } else {
      var redirectUrl = Config.webappUrl + this.props.history.createHref(this.props.location.pathname + this.props.location.search);
      return (
        <div>
          <form id="login" className="login-form" ref="submitForm" action={authUrl + "?redirect=" + encodeURIComponent(redirectUrl) } method="POST">
            <a href="#" onClick={function(evt){evt.preventDefault(); $("form#login").submit();}}><Glyphicon glyph="user" />&nbsp;Login</a>
            &nbsp;
            {helpLink}
          </form>
        </div>
      );
    }
  }
});

var AuthUtil = {
  triggerLogin: function() {
    var loginForm = $("form#login");
    if(loginForm != null) {
      loginForm.submit();
      return true;
    } else {
      return false;
    }
  }
}

module.exports = {AuthState: AuthState, AuthUtil: AuthUtil};
