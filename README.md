Project planning for vim users.

To build and work with:

- `npm install`
- in a window run `webpack --watch` to do es6 front end compliation
- in another window run `node server.js` to start the server

Optional but awesome:

Unit testing:

- `brew install fswatch`
- in another window run `fswatch test/tree.js | xargs -n1 -I{} mocha --compilers js:babel-register`

UI testing:

- install mono MDK from here (32 bit): http://www.mono-project.com/download/
- `export CHROME_LOG_FILE="chrome_debug.log"`
- `cd canopy-repl`
- `sh ./build.sh`
- run automation tests with `fshapi --exec "Tests.fsx"`

Heroku deploy:

- install heroku toolbelt: https://toolbelt.heroku.com/
- `heroku login`
- `heroku apps:create [YOURAPPNAME]`
- `git push heroku master`
- `heroku open`

Usage:

- disable vimium if you use that plugin (you won't need it)
- `j` to move down
- `k` to move down
- `c` to change entry
- `ESC` to save entry
- `x` to cut entry
