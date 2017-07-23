//from http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html

/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
function compileShader(gl, shaderSource, shaderType) {
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  return shader;
}

/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
 */
function createProgram(gl, shaders) {
  // create a program.
  var program = gl.createProgram();

  // attach the shaders.
  shaders.forEach( shader => {
    gl.attachShader(program, shader);
  })

  // link the program.
  gl.linkProgram(program);

  // Check if it linked.
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
      // something went wrong with the link
      throw ("program filed to link:" + gl.getProgramInfoLog (program));
  }

  return program;
}

/**
 * Creates a program from a list of fragment ids, where the fragments are text files.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {array} ids The list of shader ids.
 * @return {!WebGLProgram} A program
 */
function fetchFragmentsAndCreateProgram( gl, ids ) {
  console.log(`fetchFragmentsAndCreateProgram: ids=${ids}`);

  // for each id
  // - fetch the assumed fragment file
  // - construct a shader from the text
  // when all shaders are created
  // - create the combined program

  const shaderPromises = ids.map( id => {
    console.log(`fetchFragmentsAndCreateProgram: start: id=${id}`);
    if (! id.match(/(vertex|fragment)/)) {
      throw `ERROR: fetchFragmentsAndCreateProgram: id does not mention vertex or fragment: ${id}`;
    }
    const filename = `glsl/${id}.glsl`;

    return fetch( filename )
    .then( response => { return response.text(); })
    .then( shaderText => {
      console.log(`fetchFragmentsAndCreateProgram: fetched id=${id}`);
      const opt_shaderType = (id.match('vertex'))? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
      return compileShader(gl, shaderText, opt_shaderType);
    })
    ;
  });

  return Promise.all( shaderPromises )
  .then( shaders => {
    console.log('fetchFragmentsAndCreateProgram: all shaders created');
    return createProgram(gl, shaders);
  })
  ;
}
