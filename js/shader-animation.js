'use strict';

/*
 * Base class for the background animations that are drawn using fragment shader.
 * It is implemented using just WebGL.
 */

const Animation = require("./animation");

class ShaderAnimation extends Animation {
    constructor(canvas, colors, colorsAlt, bgColor, fragmentShaderSource,
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, bgColor, name, file, description, seed, 'webgl');

        const vertexShaderSource = `
            attribute vec4 aVertexPosition;
            varying vec2 vUv;

            void main(void) {
                vUv = uv;
                gl_Position = aVertexPosition;
            }
        `;
      
        // Create GLSL shaders, upload the GLSL source, compile the shaders
        let vertexShader = this.createShader(this.ctx.VERTEX_SHADER, vertexShaderSource),
            fragmentShader = this.createShader(this.ctx.FRAGMENT_SHADER, fragmentShaderSource),
            shaderProgram = this.createShaderProgram(vertexShader, fragmentShader);

        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.ctx.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                time: this.ctx.getUniformLocation(shaderProgram, 'time'),
                resolution: this.ctx.getUniformLocation(shaderProgram, 'resolution'),
            },
        };

        // Create buffer
        this.positionBuffer = this.ctx.createBuffer();
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionBuffer);
    
        const positions = [
            -1.0,  1.0,
            -1.0, -1.0,
             1.0,  1.0,
             1.0, -1.0,
        ];
    
        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, new Float32Array(positions), this.ctx.STATIC_DRAW);
    }

    createShader(type, source) {
        let shader = this.ctx.createShader(type);
        this.ctx.shaderSource(shader, source);
        this.ctx.compileShader(shader);
        if (!this.ctx.getShaderParameter(shader, this.ctx.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.ctx.getShaderInfoLog(shader));
            this.ctx.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createShaderProgram(vertexShader, fragmentShader) {
        let shaderProgram = this.ctx.createProgram();
        this.ctx.attachShader(shaderProgram, vertexShader);
        this.ctx.attachShader(shaderProgram, fragmentShader);
        this.ctx.linkProgram(shaderProgram);
        if (!this.ctx.getProgramParameter(shaderProgram, this.ctx.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.ctx.getProgramInfoLog(shaderProgram));
            this.ctx.deleteProgram(shaderProgram);
            return null;
        }
      
        return shaderProgram;
    }

    draw() {
        this.ctx.clearColor(0.0, 0.0, 0.0, 1.0);
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
    
        this.ctx.useProgram(this.programInfo.program);
    
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.positionBuffer);
        this.ctx.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 2, this.ctx.FLOAT, false, 0, 0);
        this.ctx.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Set time uniform
        if (this.programInfo.uniformLocations.time) {
            this.ctx.uniform1f(this.programInfo.uniformLocations.time, this.timeMs);
        }

        // Set the resolution uniform
        this.ctx.uniform2f(this.programInfo.uniformLocations.resolution, this.canvas.width, this.canvas.height);
    
        this.ctx.drawArrays(this.ctx.TRIANGLE_STRIP, 0, 4);
    }

    resize() {
        super.resize();
        this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/js/shader-animations" + this.file;
    }
}

module.exports = ShaderAnimation;
