"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logo_svg_1 = require("./logo.svg");
var App_module_css_1 = require("./App.module.css");
function App() {
    return (<div className={App_module_css_1.default.App}>
      <header className={App_module_css_1.default['App-header']}>
        <img src={logo_svg_1.default} className={App_module_css_1.default['App-logo']} alt="logo"/>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a className={App_module_css_1.default['App-link']} href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    </div>);
}
exports.default = App;
