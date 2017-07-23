# ConwayShader
WebGL Shader for Conway's Game of Life

forked from https://github.com/amandaghassaei/ConwayShader

Bare-bones implementation of a Conway's Game of Life shader in WebGL.  No external libraries used.
Dynamic window resizing and mouse move interaction, easily runs at 60fps.

Demo at https://railsagainstignorance.github.io/ConwayShader/.

## Observations

* rate-limited by window.requestAnimationFrame
* can now edit the fragments in their own source files
* odd hangs/race conditions when refreshing page
   * hopefully just my pants local web server


## texCoordLocation

* fix global var nastiness in main.js
* maybe decouple render from requestAnimationFrame
   * but since the intention is to do loads of processing and that will almost certainly reduce the max rate to slower than requestAnimationFrame, probably not worth worrying about.
