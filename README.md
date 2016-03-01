Project planning for vim users.

Demo: https://agilitree.herokuapp.com/

Usage:

- chrome plugins: disable vimium for this page
- `k` to move up, `j` down, `l` to move right, `h` left<br />
- `w` next sibling, `b` previous sibling
- `0 (zero)` to move to the very top, `g` to move to top of current, `G` bottom of current
- `c or i` to change item, `esc or ctrl+[` to save
- `m` to mark/highlight item (toggle)
- `o` to insert below, `O` for above
- `x or d` to delete, `p` to paste below, `P` pastes above
- `u` to undo, `ctrl+r` to redo
- `console.log(localStorage['logs']);`

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
