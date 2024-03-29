'use strict';

/*
 * Base class for all the background animations.
 */


const Animation = require("./animation");

class ShaderAnimation extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor,
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, bgColor, name, file, description, seed);
        this.ctx = canvas.getContext("webgl", { alpha: false });
        
        let vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
        let fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
      
        // Create GLSL shaders, upload the GLSL source, compile the shaders
        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      
        // Link the two shaders into a program
        var program = createProgram(gl, vertexShader, fragmentShader);
      
        // Look up where the vertex data needs to go.
        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
      
        // Create a buffer and put three 2d clip space points in it
        var positionBuffer = gl.createBuffer();
      
        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      
        var positions = [
          0, 0,
          0, 0.5,
          0.7, 0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      
        // code above this line is initialization code.
        // code below this line is rendering code.
      
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
      
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
      
        // Turn on the attribute
        gl.enableVertexAttribArray(positionAttributeLocation);
      
        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);
      
        // draw
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 3;
        gl.drawArrays(primitiveType, offset, count);
    }

    createShader(type, source) {
        let shader = this.ctx.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
          return shader;
        }
      
        console.log(this.ctx.getShaderInfoLog(shader));
        this.ctx.deleteShader(shader);
    }

    createProgram(vertexShader, fragmentShader) {
        let program = this.ctx.createProgram();
        this.ctx.attachShader(program, vertexShader);
        this.ctx.attachShader(program, fragmentShader);
        this.ctx.linkProgram(program);
        let success = this.ctx.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
          return program;
        }
      
        console.log(this.ctx.getProgramInfoLog(program));
        this.ctx.deleteProgram(program);
    }

    draw() {

    }
}

module.exports = ShaderAnimation;
