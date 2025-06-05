'use strict';

/*
 * Alternative implementation of the base class 
 * for the background animations that are drawn using fragment shader,
 * implemented using Three.js.
 * Can be used a replacement for the ShaderAnimation class in shader-animation.js.
 */

const ThreejsAnimation = require("./threejs-animation");

class ShaderAnimation extends ThreejsAnimation {
    constructor(canvas, colors, colorsAlt, bgColor, fragmentShaderSource,
                name = "",
                file = "",
                description = "",
                seed = "random") {
        super(canvas, colors, colorsAlt, bgColor, name, file, description, seed, 'webgl');

        const vertexShaderSource = `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: {
                timeMs: { value: this.timeMs },
                time: { value: this.time },
                resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) }
            }
        });

        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);
        this.scene.add(this.mesh);
    }

    update(elapsed) {
        super.update(elapsed);
        this.shaderMaterial.uniforms.timeMs.value = this.timeMs;
        this.shaderMaterial.uniforms.time.value = this.time;
    }

    resize(){
        super.resize();
        this.shaderMaterial.uniforms.resolution.value.set(this.canvas.width * 2, this.canvas.height * 2);
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/js/shader-animations" + this.file;
    }
}

module.exports = ShaderAnimation;
