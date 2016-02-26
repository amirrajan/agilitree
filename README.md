Project planning for vim users.

Demo: https://agilitree.herokuapp.com/

Usage:

- disable vimium if you use that plugin (you won't need it)
- `j` to move down
- `k` to move up
- `c` to change entry
- `ESC` to save entry
- `x` to cut entry

To build and work with locally:

- `npm install`
- in a window run `webpack --watch` to do es6 front end compliation
- in another window run `node server.js` to start the server

Heroku deploy:

- install heroku toolbelt: https://toolbelt.heroku.com/
- `heroku login`
- `heroku apps:create [YOURAPPNAME]`
- `git push heroku master`
- `heroku open`

Optional but awesome:

Unit testing:

- run tests with `mocha --compilers js:babel-register`
- to auto test `brew install fswatch`
- in another window run `fswatch test/tree.js | xargs -n1 -I{} mocha --compilers js:babel-register`

UI testing:

- install mono MDK from here (32 bit): http://www.mono-project.com/download/
- `export CHROME_LOG_FILE="chrome_debug.log"`
- `cd canopy-repl`
- `sh ./build.sh`
- run automation tests with `fshapi --exec "Tests.fsx"`
