'use strict';

const NAME = "Perlin noise grid shader",
      FILE = "perlin-noise-grid.js",
      DESC = `
Grid of squares, circles, or soft circles with size driven by animated Perlin noise.
Optional sigmoid function with controlable alpha 
can be applied to the noise to make the size distribution more extreme.

This is shader port of the 
[Perlin noise groid](https://mwydmuch.pl/animations?animation=perlin-noise-grid) 
animation I wrote in the past.

Coded by me (Marek Wydmuch) in 2026.
`;

const SHADER_NOISE = require("../shader-noise");

const FRAGMENT_SHADER = `
    precision highp float;

    uniform float time;
    uniform float cellSize;
    uniform float cellPadding;
    uniform float noiseScale;
    uniform int cellStyle;
    uniform bool applySigmoid;
    uniform float sigmoidAlpha;
    uniform vec2 resolution;
    uniform vec3 mainColor;
    uniform vec3 altColor;
    uniform vec3 bgColor;
    uniform vec3 noiseSpeed;
    uniform vec3 seedOffset;
    varying vec2 vUv;
`
+ SHADER_NOISE +
`
    float squareMask(vec2 localPos, float halfSize) {
        vec2 edge = vec2(halfSize) - abs(localPos);
        return smoothstep(-0.75, 0.75, min(edge.x, edge.y));
    }

    float circleMask(vec2 localPos, float radius) {
        float dist = length(localPos);
        return 1.0 - smoothstep(radius - 0.75, radius + 0.75, dist);
    }

    float softCircleMask(vec2 localPos, float radius) {
        return clamp(1.0 - length(localPos) / radius, 0.0, 1.0);
    }

    void main() {
        vec2 pixel = vUv * resolution,
             cells = ceil(resolution / cellSize),
             gridSize = cells * cellSize,
             offset = (resolution - gridSize) * 0.5,
             cell = floor((pixel - offset) / cellSize),
             center = offset + cell * cellSize + cellSize * 0.5;

        vec3 noisePos = vec3(noiseSpeed.xy * time * 10.0, noiseSpeed.z * time * 0.05);
        float noiseValue = perlin3(vec3((center + noisePos.xy) * noiseScale, noisePos.z) + seedOffset),
              noiseNorm = applySigmoid
                  ? 1.0 / (1.0 + exp(-sigmoidAlpha * noiseValue))
                  : clamp(noiseValue * 0.5 + 0.5, 0.0, 1.0);

        float maxCellSize = max(0.0, cellSize - 2.0 * cellPadding),
              size = maxCellSize * noiseNorm,
              radius = size * 0.5,
              mask = 0.0;

        if (size > 0.1) {
            vec2 localPos = pixel - center;
            if (cellStyle == 0) mask = squareMask(localPos, radius);
            else if (cellStyle == 1) mask = circleMask(localPos, radius);
            else mask = softCircleMask(localPos, radius);
        }

        vec3 cellColor = mix(altColor, mainColor, noiseNorm),
             color = mix(bgColor, cellColor, clamp(mask, 0.0, 1.0));
        gl_FragColor = vec4(color, 1.0);
    }
`;

const Utils = require("../utils");
const ShaderAnimation = require("../threejs-shader-animation");

class PerlinNoiseGridShader extends ShaderAnimation {
    constructor(canvas, colors, colorsAlt, bgColor,
                cellSize = 12,
                cellPadding = -4,
                cellStyle = "random",
                noiseScale = 0.002,
                noiseSpeed = {x: "random", y: "random", z: 10},
                applySigmoid = true,
                sigmoidAlpha = 4
            ) {
        super(canvas, colors, colorsAlt, bgColor, FRAGMENT_SHADER, NAME, FILE, DESC);

        this.cellSize = cellSize;
        this.cellPadding = cellPadding;
        this.cellStyles = ["square", "circle", "soft circle"];
        this.cellStyle = this.assignIfRandom(cellStyle, Utils.randomChoice(this.cellStyles));
        this.noiseScale = noiseScale;
        this.noiseSpeed = Object.assign({}, noiseSpeed);
        this.noiseSpeed.x = this.assignIfRandom(this.noiseSpeed.x, Utils.round(Utils.randomRange(-10, 10), 1));
        this.noiseSpeed.y = this.assignIfRandom(this.noiseSpeed.y, Utils.round(Utils.randomRange(-10, 10), 1));
        this.applySigmoid = applySigmoid;
        this.sigmoidAlpha = sigmoidAlpha;

        this.uAltColor = new THREE.Color(this.colorsAlt[0]);
        this.uNoiseSpeed = new THREE.Vector3(this.noiseSpeed.x, this.noiseSpeed.y, this.noiseSpeed.z);
        this.uSeedOffset = new THREE.Vector3();
        this.updateSeedOffset();

        this.shaderMaterial.uniforms.cellSize = { value: this.cellSize };
        this.shaderMaterial.uniforms.cellPadding = { value: this.cellPadding };
        this.shaderMaterial.uniforms.noiseScale = { value: this.noiseScale };
        this.shaderMaterial.uniforms.cellStyle = { value: this.getCellStyleId() };
        this.shaderMaterial.uniforms.applySigmoid = { value: this.applySigmoid };
        this.shaderMaterial.uniforms.sigmoidAlpha = { value: this.sigmoidAlpha };
        this.shaderMaterial.uniforms.altColor = { value: this.uAltColor };
        this.shaderMaterial.uniforms.noiseSpeed = { value: this.uNoiseSpeed };
        this.shaderMaterial.uniforms.seedOffset = { value: this.uSeedOffset };
    }

    getCellStyleId() {
        return Math.max(0, this.cellStyles.indexOf(this.cellStyle));
    }

    updateSeedOffset() {
        const seed = this.seed / this.maxSeedValue;
        this.uSeedOffset.set(seed * 113.7 + 3.1, seed * 47.3 + 19.7, seed * 71.9 + 5.3);
    }

    update(elapsed) {
        super.update(elapsed);

        this.uNoiseSpeed.set(this.noiseSpeed.x, this.noiseSpeed.y, this.noiseSpeed.z);
        this.shaderMaterial.uniforms.cellSize.value = this.cellSize;
        this.shaderMaterial.uniforms.cellPadding.value = this.cellPadding;
        this.shaderMaterial.uniforms.noiseScale.value = this.noiseScale;
        this.shaderMaterial.uniforms.cellStyle.value = this.getCellStyleId();
        this.shaderMaterial.uniforms.applySigmoid.value = this.applySigmoid;
        this.shaderMaterial.uniforms.sigmoidAlpha.value = this.sigmoidAlpha;
        this.shaderMaterial.uniforms.altColor.value.set(this.uAltColor);
        this.shaderMaterial.uniforms.noiseSpeed.value.copy(this.uNoiseSpeed);
        this.shaderMaterial.uniforms.seedOffset.value.copy(this.uSeedOffset);
        return elapsed;
    }

    restart() {
        super.restart();
        this.updateSeedOffset();
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        if(this.uAltColor) this.uAltColor.set(this.colorsAlt[0]);
    }

    getSettings() {
        return [
            {prop: "cellSize", type: "int", min: 4, max: 64},
            {prop: "cellPadding", type: "float", step: 1, min: -8, max: 8},
            {prop: "cellStyle", type: "select", values: this.cellStyles},
            {prop: "applySigmoid", type: "bool"},
            {prop: "sigmoidAlpha", type: "float", step: 0.1, min: 0.1, max: 20},
            {prop: "noiseScale", type: "float", step: 0.0001, min: 0.0005, max: 0.0125},
            {prop: "noiseSpeed.x", type: "float", step: 0.1, min: -10, max: 10},
            {prop: "noiseSpeed.y", type: "float", step: 0.1, min: -10, max: 10},
            {prop: "noiseSpeed.z", type: "float", step: 0.1, min: -10, max: 10},
            this.getSeedSettings()
        ];
    }
}

module.exports = PerlinNoiseGridShader;
