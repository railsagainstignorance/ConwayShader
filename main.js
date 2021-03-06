/**
 * Created by ghassaei on 2/20/16.
 */


var gl;
var canvas;
var lastState;
var currentState;
var frameBuffer;

var resizedLastState;
var resizedCurrentState;

var width;
var height;

var flipYLocation;
var textureSizeLocation;
var mouseCoordLocation;

var paused = false;//while window is resizing

window.onload = initGL;

function initGL() {

    // Get A WebGL context
    canvas = document.getElementById("glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    canvas.onmousemove = onMouseMove;

    window.onresize = onResize;

    gl = canvas.getContext("experimental-webgl");
    if (!gl) {
        alert('Could not initialize WebGL, try another browser');
        return;
    }

    gl.disable(gl.DEPTH_TEST);

    // fetch all the program fragments,
    // inject them into script elements with appropriate ids
    // then look them up using script ids and compile the overall program.
    const fragmentIds = ['2d-vertex-shader', '2d-fragment-shader'];
    console.log(`initGL: fragmentIds=${fragmentIds}`);

    const fragmentPromises = fragmentIds.map( f => {
      return fetchGlslFragment( document, f );
    })

    Promise.all( fragmentPromises )
    .then( () => {
      console.log('initGL: all fragments fetched');
      return createProgramFromScripts(gl, fragmentIds);
    })
    .then( program => {
      gl.useProgram(program);

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");

      // Create a buffer for positions
      var bufferPos = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1.0, -1.0,
          1.0, -1.0,
          -1.0, 1.0,
          -1.0, 1.0,
          1.0, -1.0,
          1.0, 1.0]), gl.STATIC_DRAW);


      //flip y
      flipYLocation = gl.getUniformLocation(program, "u_flipY");

      //set texture location
      var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

      textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

      mouseCoordLocation = gl.getUniformLocation(program, "u_mouseCoord");

      // provide texture coordinates for the rectangle.
      var texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.0, 0.0,
          1.0, 0.0,
          0.0, 1.0,
          0.0, 1.0,
          1.0, 0.0,
          1.0, 1.0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);


      onResize();

      lastState = resizedLastState;
      currentState = resizedCurrentState;
      resizedLastState = null;
      resizedCurrentState = null;

      frameBuffer = gl.createFramebuffer();

      gl.bindTexture(gl.TEXTURE_2D, lastState);//original texture

      render();
    })
    ;
}

function makeRandomArray(rgba){
    var numPixels = rgba.length/4;
    var probability = 0.15;
    for (var i=0;i<numPixels;i++) {
        var ii = i * 4;
        var state = Math.random() < probability ? 1 : 0;
        rgba[ii] = rgba[ii + 1] = rgba[ii + 2] = state ? 255 : 0;
        rgba[ii + 3] = 255;
    }
    return rgba;
}

function makeTexture(gl){

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

var countUnpausedRenders = 0;
var startUnpausedRendersMillis;

function render(){

    if (paused) {
      countUnpausedRenders = 0;
    } else {
      if (countUnpausedRenders == 0) {
        startUnpausedRendersMillis = performance.now();
      }
      if (resizedLastState) {
          lastState = resizedLastState;
          resizedLastState = null;
      }
      if (resizedCurrentState) {
          currentState = resizedCurrentState;
          resizedCurrentState = null;
      }

      // don't y flip images while drawing to the textures
      gl.uniform1f(flipYLocation, 1);

      step();

      gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
      gl.bindTexture(gl.TEXTURE_2D, lastState);

      //draw to canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, lastState);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      countUnpausedRenders++;
      if (countUnpausedRenders % 100 == 0) {
        const nowMillis = performance.now();
        const elapsedMillis = nowMillis - startUnpausedRendersMillis;
        const frameRatePerSec = 1000 * countUnpausedRenders / elapsedMillis ;
        const millisPerFrame = elapsedMillis / countUnpausedRenders;
        console.log(`render: frameRatePerSec=${frameRatePerSec}`);
      }
    }

    window.requestAnimationFrame(render);
}

function step(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);

    gl.bindTexture(gl.TEXTURE_2D, lastState);

    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

    var temp = lastState;
    lastState = currentState;
    currentState = temp;
}

function onResize(){
    paused = true;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    gl.viewport(0, 0, width, height);

    // set the size of the texture
    gl.uniform2f(textureSizeLocation, width, height);

    //texture for saving output from frag shader
    resizedCurrentState = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    resizedLastState = makeTexture(gl);
    //fill with random pixels
    var rgba = new Uint8Array(width*height*4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, makeRandomArray(rgba));

    paused = false;
}

function onMouseMove(e){
    gl.uniform2f(mouseCoordLocation, e.clientX/width, e.clientY/height);
}
