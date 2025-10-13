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
        this.scale = 1.0;

        this.uMainColor = new THREE.Color(this.mainColor);
        this.uSecColor = new THREE.Color(this.secColor);
        this.uBgColor = new THREE.Color(this.bgColor);
        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: {
                timeMs: { value: this.timeMs },
                time: { value: this.time },
                resolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
                scale: { value: this.scale },
                mainColor: { value: this.uMainColor },
                secColor: { value: this.uSecColor },
                bgColor: { value: this.uBgColor }
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
        this.shaderMaterial.uniforms.scale.value = this.scale;
        this.shaderMaterial.uniforms.mainColor.value.set(this.uMainColor);
        this.shaderMaterial.uniforms.secColor.value.set(this.uSecColor);
        this.shaderMaterial.uniforms.bgColor.value.set(this.uBgColor);
        return elapsed;
    }

    updateColors(colors, colorsAlt, bgColor){
        super.updateColors(colors, colorsAlt, bgColor);
        this.uMainColor.set(this.mainColor);
        this.uSecColor.set(this.secColor);
        this.uBgColor.set(this.bgColor);
    }

    resize(){
        super.resize();
        this.shaderMaterial.uniforms.resolution.value.set(this.canvas.width, this.canvas.height);
    }

    getCodeUrl(){
        return "https://github.com/mwydmuch/mwydmuch.github.io/blob/master/js/shader-animations" + this.file;
    }

    getSettings() {
        return [
            {prop: "scale", icon: '<i class="fa-solid fa-maximize"></i>', type: "float", min: 0.05, max: 1.95},
            {prop: "speed", icon: '<i class="fa-solid fa-gauge-high"></i>', type: "float", step: 0.1, min: -4, max: 4},
        ];
    }
}

module.exports = ShaderAnimation;
