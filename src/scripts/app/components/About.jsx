var log = require("loglevel");

var React = require("react"),
    Constants = require("../constants");

var getConfig = require("../../config");

var Main = React.createClass({
  render: function() {
    var Config = getConfig().Config;
    return(
      <div className="aboutBox">
        <p>
          The CMDI Component Registry provides long term storage and easy
          browsing, creation and editing of components and profiles for
          the <a href="https://www.clarin.eu">CLARIN</a> infrastructure.
        </p>
        <table>
          <tbody>
            <tr>
              <td>Back end version:</td>
              <td>{Config.backEndVersion || "unknown"}</td>
            </tr>
            <tr>
              <td>Front end version:</td>
              <td>
                {__FRONT_END_VERSION__ || "unknown"}
                {__FRONT_END_COMMITHASH__ != null &&
                  <span> ({__FRONT_END_COMMITHASH__.substring(0,8)})</span>
                }
              </td>
            </tr>
            <tr>
              <td>License:</td>
              <td><a href="http://www.gnu.org/licenses/gpl-3.0.html">GPL version 3</a></td>
            </tr>
            <tr>
              <td>Source code:</td>
              <td><a href="https://github.com/clarin-eric">https://github.com/clarin-eric</a></td>
            </tr>
            <tr>
              <td>Written by:</td>
              <td>Patrick Duin, Twan Goosen, Mitchell Seaton, Olha Shkaravska, George Georgovassilis, Jean-Charles Ferrieres</td>
            </tr>
          </tbody>
        </table>
        <p>Go to <a href="https://www.clarin.eu/cmdi">www.clarin.eu/cmdi</a> for more information.<br/>
        Email <a href="mailto:cmdi@clarin.eu">cmdi@clarin.eu</a> for questions/support.</p>
        <div className="licence">
          <p>Copyright (C) 2016 CLARIN ERIC</p>
          <p>This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>
          <p>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.</p>
          <p>You should have received a copy of the GNU General Public License along with this program. If not, see <a href="http://www.gnu.org/licenses/">http://www.gnu.org/licenses/</a>.</p>
        </div>
        <div>
          Icons by <a href="http://glyphicons.com/">Glyphicons</a>
        </div>
      </div>
    );
  }
});
module.exports = Main;
