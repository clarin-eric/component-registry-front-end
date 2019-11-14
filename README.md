# CLARIN Component Registry - React.js front end

This project implements a front end for the
[CLARIN Component Registry](https://catalog.clarin.eu/ds/ComponentRegistry), part of 
CLARIN's [Component Metadata Infrastructure](https://www.clarin.eu/cmdi) (CMDI).

This front end communicates with the Component Registry REST interface (see the
[component-registry-rest](https://github.com/clarin-eric/component-registry-rest) 
project). The main building blocks of this application are:

- [React](https://facebook.github.io/react/) (currently version 0.14)
- [Fluxxor](http://www.fluxxor.com)
- [jQuery](http://www.jquery.com)
- [Bootstrap](http://getbootstrap.com/) through [react-boostrap](https://react-bootstrap.github.io) components
- [Jsonix](https://github.com/highsource/jsonix) for XML serialisation
- For building:
  - [Webpack](https://webpack.js.org/) 
  - [Babel](https://babeljs.io)
  - [SCSS](https://sass-lang.com) ([sass-loader](https://www.npmjs.com/package/sass-loader) with [node-sass](https://www.npmjs.com/package/node-sass))

To build, run `npm install`, then `npm start build`. 

To start a development server, run `npm start run`.

More information, including UML diagrams, can be found in the project's [wiki](../../wiki).

## Getting started quickly
To run the application in development mode:
- Start the Component Registry back end/REST service (see 
[component-registry-rest](https://github.com/clarin-eric/component-registry-rest))
- If necessary, adapt the configuration in `webpack.dev.js` to match the back end root
location
    - You can also change the settings in `src/compRegConfig.jsp` but unless the
      development server is used to proxy the back end, CORS issues can be expected.
- Install dependencies by running `npm install`
- Start the webpack dev server by running `npm start run`
- The project has hot reloading configured, so making changing to the code will reload
the application in the dev server without need to restart it manually

## Build
For local testing and development you can make a local build using  `npm start build`. 

For other purposes, it is advisable to build the docker image. This is managed in a 
separate repository: 
[docker-component-registry-front-end](https://gitlab.com/CLARIN-ERIC/docker-component-registry-front-end).
Building this image will build the application from sources so there is no need to compile
it separately. The build script fetches published sources by default but can be configured
to use a local source directory. See the repository for details.

## Links

- [CLARIN Trac pages for the Component Registry](https://trac.clarin.eu/wiki/ComponentRegistryAndEditor)
- Back end project:
[component-registry-rest](https://github.com/clarin-eric/component-registry-rest)
- Docker image project for this front end application:
[docker-component-registry-front-end](https://gitlab.com/CLARIN-ERIC/docker-component-registry-front-end)
- Docker Compose project for the Componen Registry (back end and front end):
[compose_compreg](https://gitlab.com/CLARIN-ERIC/compose_compreg)

## Licence

Copyright (C) 2019  CLARIN ERIC

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
