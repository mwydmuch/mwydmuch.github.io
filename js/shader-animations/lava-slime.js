'use strict';

const NAME = "Lava slime",
      FILE = "lava-slime.js",
      DESC = `
Animation simulating a lava lamp with soft blobs that float and merge together. 

The animation use raymarching to render smooth union surfaces of the blobs + lightning.

Coded by me (Marek Wydmuch) + Codex with GPT 5.5 in 2026.
`;

const ThreejsShaderAnimation = require("../threejs-shader-animation");
const Utils = require("../utils");

const MAX_BLOBS = 32,
      DEFORMATION_BLOBS_PER_MAIN = 3,
      MAX_FIELD_BLOBS = MAX_BLOBS * (DEFORMATION_BLOBS_PER_MAIN + 1),
      DEFAULT_BLOB_COUNT = 16,
      MIN_RADIUS = 0.30,
      MAX_RADIUS = 1.0,
      VERTICAL_LIMIT = 3.15,
      TOP_MARGIN = 0.35,
      MAX_DELTA_TIME = 1 / 15;

const MOVEMENT_MODES = [
    "bottom to top",
    "top to bottom",
    "lava lamp"
];

const LIGHT_POSITIONS = [
    "top left",
    "top",
    "top right",
    "left",
    "front",
    "right",
    "bottom left",
    "bottom",
    "bottom right"
];

const LIGHT_DIRECTIONS = {
    "top left": [-0.55, 0.78, 0.92],
    "top": [0, 1, 0.82],
    "top right": [0.55, 0.78, 0.92],
    "left": [-1, 0, 0.78],
    "front": [0, 0, 1],
    "right": [1, 0, 0.78],
    "bottom left": [-0.55, -0.78, 0.92],
    "bottom": [0, -1, 0.82],
    "bottom right": [0.55, -0.78, 0.92]
};

const FRAGMENT_SHADER = `
precision highp float;

#define MAX_FIELD_BLOBS ${MAX_FIELD_BLOBS}

varying vec2 vUv;

uniform vec2 uResolution;
uniform vec4 uBlobs[MAX_FIELD_BLOBS];
uniform int uBlobCount;
uniform float uFusionStrength;
uniform bool uGlowEnabled;
uniform float uGlowStrength;
uniform float uGlowRadius;
uniform float uTime;
uniform vec3 uLightDirection;
uniform vec3 uBackground;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

float smoothUnion(float distanceA, float distanceB, float strength) {
    float blend = clamp(
        0.5 + 0.5 * (distanceB - distanceA) / strength,
        0.0,
        1.0
    );
    return mix(distanceB, distanceA, blend) -
        strength * blend * (1.0 - blend);
}

float sceneDistance(vec3 point) {
    float distanceToSurface = 100.0;

    for (int i = 0; i < MAX_FIELD_BLOBS; ++i) {
        if (i >= uBlobCount) break;

        vec4 blob = uBlobs[i];
        float sphereDistance = length(point - blob.xyz) - blob.w;
        distanceToSurface = smoothUnion(
            distanceToSurface,
            sphereDistance,
            uFusionStrength
        );
    }

    return distanceToSurface;
}

vec3 getNormal(vec3 point) {
    const float epsilon = 0.006;
    const vec2 offset = vec2(1.0, -1.0) * 0.5773 * epsilon;
    return normalize(
        offset.xyy * sceneDistance(point + offset.xyy) +
        offset.yyx * sceneDistance(point + offset.yyx) +
        offset.yxy * sceneDistance(point + offset.yxy) +
        offset.xxx * sceneDistance(point + offset.xxx)
    );
}

void main() {
    vec2 screenPoint = vUv * 2.0 - 1.0;
    screenPoint.x *= uResolution.x / max(uResolution.y, 1.0);

    vec3 rayOrigin = vec3(0.0, 0.0, 6.2);
    vec3 rayDirection = normalize(vec3(screenPoint, -2.35));
    float distanceAlongRay = 0.0;
    float closestDistance = 100.0;
    vec3 point = rayOrigin;
    bool surfaceHit = false;

    for (int step = 0; step < 72; ++step) {
        point = rayOrigin + rayDirection * distanceAlongRay;
        float distanceToSurface = sceneDistance(point);
        closestDistance = min(closestDistance, max(distanceToSurface, 0.0));

        if (distanceToSurface < 0.004) {
            surfaceHit = true;
            break;
        }

        distanceAlongRay += max(distanceToSurface * 0.72, 0.012);
        if (distanceAlongRay > 12.0) break;
    }

    if (!surfaceHit) {
        float glow = 0.0;
        if (uGlowEnabled) {
            glow = exp(-closestDistance / max(uGlowRadius, 0.001)) *
                uGlowStrength;
        }
        float haloOpacity = clamp(glow * 0.48, 0.0, 0.86);
        vec3 glowColor = mix(uColorA, uColorC, 0.68);
        gl_FragColor = vec4(
            mix(uBackground, glowColor, haloOpacity),
            1.0
        );
        return;
    }

    vec3 normal = getNormal(point);
    vec3 viewDirection = -rayDirection;
    vec3 lightDirection = normalize(uLightDirection);
    vec3 fillDirection = normalize(vec3(
        -lightDirection.x,
        -lightDirection.y,
        max(0.42, lightDirection.z * 0.62)
    ));
    vec3 halfDirection = normalize(lightDirection + viewDirection);

    float diffuse = 0.25 + 0.68 * max(dot(normal, lightDirection), 0.0) +
        0.18 * max(dot(normal, fillDirection), 0.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 58.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0);

    float verticalMix = clamp(point.y / 6.3 + 0.5, 0.0, 1.0);
    vec3 gelColor = mix(uColorA, uColorB, verticalMix);
    float slowFlow = 0.5 + 0.5 * sin(point.y * 1.1 - uTime * 0.32);
    gelColor = mix(gelColor, uColorC, slowFlow * 0.16);

    vec3 shadedGel = gelColor * diffuse;
    shadedGel += vec3(1.0) * specular * 0.82;
    shadedGel += uColorC * fresnel * 0.28;
    if (uGlowEnabled) {
        shadedGel += gelColor * uGlowStrength * 0.10;
        shadedGel += uColorC * fresnel * uGlowStrength * 0.12;
    }

    gl_FragColor = vec4(shadedGel, 1.0);
}
`;

class LavaSlimeAnimation extends ThreejsShaderAnimation {
    constructor(canvas, colors, colorsAlt, bgColor,
        blobCount = 20,
        movementSpeed = 0.72,
        horizontalStrength = 1.0,
        verticalSwayStrength = 1.0,
        depthSwayStrength = 1.0,
        fusionStrength = 0.5,
        glowEnabled = true,
        glowStrength = 1,
        glowRadius = 0.35,
        deformationEnabled = true,
        deformationStrength = 0.8,
        movementMode = "random",
        lightPosition = "random"
    ) {
        super(canvas, colors, colorsAlt, bgColor, FRAGMENT_SHADER, NAME, FILE, DESC);

        this.blobCount = DEFAULT_BLOB_COUNT;
        this.movementSpeed = 0.72;
        this.horizontalStrength = 1.0;
        this.verticalSwayStrength = 1.0;
        this.depthSwayStrength = 1.0;
        this.fusionStrength = 0.32;
        this.glowEnabled = true;
        this.glowStrength = 0.75;
        this.glowRadius = 0.35;
        this.deformationEnabled = true;
        this.deformationStrength = 0.8;
        this.movementMode = this.assignIfRandom(movementMode, Utils.randomChoice(MOVEMENT_MODES));
        this.lightPosition = this.assignIfRandom(lightPosition, Utils.randomChoice(LIGHT_POSITIONS));

        this.blobUniforms = Array.from(
            {length: MAX_FIELD_BLOBS},
            () => new THREE.Vector4(0, -10, 0, 0)
        );

        this.uniforms = this.shaderMaterial.uniforms;
        Object.assign(this.uniforms, {
            uResolution: {value: new THREE.Vector2(canvas.width, canvas.height)},
            uBlobs: {value: this.blobUniforms},
            uBlobCount: {value: this.blobCount},
            uFusionStrength: {value: this.fusionStrength},
            uGlowEnabled: {value: this.glowEnabled},
            uGlowStrength: {value: this.glowStrength},
            uGlowRadius: {value: this.glowRadius},
            uTime: {value: 0},
            uLightDirection: {value: new THREE.Vector3()},
            uBackground: {value: new THREE.Color(bgColor)},
            uColorA: {value: new THREE.Color()},
            uColorB: {value: new THREE.Color()},
            uColorC: {value: new THREE.Color()}
        });

        // Keep descriptive aliases for code that inspects this animation directly.
        this.material = this.shaderMaterial;
        this.surface = this.mesh;
        this.surface.frustumCulled = false;

        this.blobs = [];
        this.updateLightDirection();
        this.updatePalette();
        this.createBlobs();
    }

    updateLightDirection() {
        if (!this.uniforms) return;

        const direction = LIGHT_DIRECTIONS[this.lightPosition] ||
            LIGHT_DIRECTIONS[LIGHT_POSITIONS[0]];
        this.uniforms.uLightDirection.value.set(
            direction[0],
            direction[1],
            direction[2]
        );
    }

    getAspect() {
        return this.canvas.width / Math.max(this.canvas.height, 1);
    }

    getHorizontalLimit() {
        return 2.62 * this.getAspect();
    }

    getLavaLampBounds(blob) {
        const deformation = this.deformationEnabled
                ? THREE.MathUtils.clamp(this.deformationStrength, 0, 2)
                : 0,
              deformationRadius = deformation > 0
                ? blob.radius * Math.max(1, 0.82 + 0.25 * deformation)
                : blob.radius,
              verticalSwayRadius = blob.verticalSwayAmplitude *
                this.verticalSwayStrength,
              clearance = deformationRadius + verticalSwayRadius;

        return {
            bottom: Math.min(0, -VERTICAL_LIMIT + clearance),
            top: Math.max(0, VERTICAL_LIMIT - clearance)
        };
    }

    createBlob(index, startAtEntryEdge) {
        const radius = MIN_RADIUS + this.rand() * (MAX_RADIUS - MIN_RADIUS),
              horizontalLimit = Math.max(0.2, this.getHorizontalLimit() - radius * 1.1),
              swayAmplitude = (0.20 + this.rand() * 0.48) *
                  Math.min(1, horizontalLimit / 0.8),
              availableX = Math.max(0, horizontalLimit - swayAmplitude),
              verticalSwayAmplitude = 0.10 + this.rand() * 0.27,
              bottomEntry = -VERTICAL_LIMIT - radius - this.rand() * 0.65,
              topEntry = VERTICAL_LIMIT + radius + this.rand() * 0.65;

        const blob = {
            radius: radius,
            y: 0,
            verticalDirection: 1,
            baseX: (this.rand() * 2 - 1) * availableX,
            swayAmplitude: swayAmplitude,
            swayFrequency: 0.48 + this.rand() * 0.58,
            horizontalPhase: this.rand() * Math.PI * 2,
            verticalSwayAmplitude: verticalSwayAmplitude,
            verticalSwayFrequency: 0.72 + this.rand() * 0.75,
            verticalPhase: this.rand() * Math.PI * 2,
            baseZ: (this.rand() * 2 - 1) * 0.62,
            depthSwayAmplitude: 0.14 + this.rand() * 0.30,
            depthSwayFrequency: 0.35 + this.rand() * 0.48,
            depthPhase: this.rand() * Math.PI * 2,
            deformationPhase: this.rand() * Math.PI * 2,
            speedFactor: 0.72 + this.rand() * 0.62
        };

        if (this.movementMode === "top to bottom") {
            blob.y = startAtEntryEdge
                ? topEntry
                : topEntry - this.rand() * (topEntry - bottomEntry);
            blob.verticalDirection = -1;
        } else if (this.movementMode === "lava lamp") {
            const bounds = this.getLavaLampBounds(blob);
            blob.y = startAtEntryEdge
                ? bounds.bottom
                : bounds.bottom + this.rand() * (bounds.top - bounds.bottom);
            blob.verticalDirection = startAtEntryEdge || this.rand() < 0.5 ? 1 : -1;
        } else {
            blob.y = startAtEntryEdge
                ? bottomEntry
                : bottomEntry + this.rand() * (topEntry - bottomEntry);
            blob.verticalDirection = 1;
        }

        this.blobs[index] = blob;
        return blob;
    }

    createBlobs() {
        this.blobs.length = 0;
        const count = Math.min(MAX_BLOBS, Math.max(1, Math.round(this.blobCount)));
        this.blobCount = count;

        for (let i = 0; i < count; ++i) this.createBlob(i, false);
        for (let i = 0; i < MAX_FIELD_BLOBS; ++i)
            this.blobUniforms[i].set(0, -10, 0, 0);
        this.updateBlobUniforms();
    }

    updateBlobUniforms() {
        let fieldBlobIndex = 0;

        for (let i = 0; i < this.blobCount; ++i) {
            const blob = this.blobs[i],
                  horizontalSway = Math.sin(
                      this.time * blob.swayFrequency + blob.horizontalPhase
                  ) + Math.sin(
                      this.time * blob.swayFrequency * 0.47 + blob.horizontalPhase * 1.7
                  ) * 0.26,
                  verticalSway = Math.sin(
                      this.time * blob.verticalSwayFrequency + blob.verticalPhase
                  ) * blob.verticalSwayAmplitude * this.verticalSwayStrength,
                  depthSway = Math.sin(
                      this.time * blob.depthSwayFrequency + blob.depthPhase
                  ) * blob.depthSwayAmplitude * this.depthSwayStrength,
                  x = blob.baseX + horizontalSway * blob.swayAmplitude * this.horizontalStrength,
                  y = blob.y + verticalSway,
                  z = blob.baseZ + depthSway;

            this.blobUniforms[fieldBlobIndex++].set(x, y, z, blob.radius);

            if (this.deformationEnabled && this.deformationStrength > 0) {
                const deformation = THREE.MathUtils.clamp(
                    this.deformationStrength, 0, 2
                );

                for (let satellite = 0;
                    satellite < DEFORMATION_BLOBS_PER_MAIN;
                    ++satellite) {
                    const phase = blob.deformationPhase + i * 1.731 +
                              satellite * Math.PI * 2 / DEFORMATION_BLOBS_PER_MAIN,
                          speed = 0.46 + satellite * 0.09 + (i % 4) * 0.035,
                          time = this.time * speed,
                          swayX = Math.sin(time * 1.13 + phase) +
                              0.28 * Math.sin(time * 0.47 - phase * 1.31),
                          swayY = Math.cos(time * 0.91 + phase * 1.17) +
                              0.22 * Math.sin(time * 1.57 + phase),
                          swayZ = Math.sin(time * 0.73 - phase * 0.83) +
                              0.25 * Math.cos(time * 1.29 + phase * 1.43),
                          swayLength = Math.max(
                              0.0001,
                              Math.sqrt(swayX * swayX + swayY * swayY + swayZ * swayZ)
                          ),
                          sizeVariation = 0.88 +
                              0.10 * Math.sin(phase * 2.37 + time * 0.31),
                          satelliteRadius = Math.min(
                              blob.radius,
                              blob.radius * (0.14 + 0.18 * deformation) *
                                  sizeVariation
                          ),
                          orbitRadius = blob.radius *
                              (0.54 + 0.11 * deformation +
                                  0.07 * Math.sin(time * 0.62 + phase));

                    this.blobUniforms[fieldBlobIndex++].set(
                        x + swayX / swayLength * orbitRadius,
                        y + swayY / swayLength * orbitRadius,
                        z + swayZ / swayLength * orbitRadius,
                        satelliteRadius
                    );
                }
            }
        }

        this.uniforms.uBlobCount.value = fieldBlobIndex;
    }

    updatePalette() {
        if (!this.uniforms) return;

        const fallback = ["#176f7a", "#41b8ad", "#aeeabf"],
              palette = this.colors.length ? this.colors : fallback;
        this.uniforms.uColorA.value.set(palette[0] || fallback[0]);
        this.uniforms.uColorB.value.set(palette[Math.min(2, palette.length - 1)] || fallback[1]);
        this.uniforms.uColorC.value.set(palette[Math.min(3, palette.length - 1)] || fallback[2]);
        this.uniforms.uBackground.value.set(this.bgColor);
    }

    update(elapsedMs) {
        super.update(elapsedMs);
        const deltaTime = Math.min(
            MAX_DELTA_TIME,
            Math.max(0, elapsedMs / 1000)
        );

        for (let i = 0; i < this.blobCount; ++i) {
            const blob = this.blobs[i],
                  movement = this.movementSpeed * blob.speedFactor * deltaTime;

            if (this.movementMode === "lava lamp") {
                const bounds = this.getLavaLampBounds(blob);
                blob.y += movement * blob.verticalDirection;

                if (blob.y > bounds.top) {
                    blob.y = bounds.top - (blob.y - bounds.top);
                    blob.verticalDirection = -1;
                } else if (blob.y < bounds.bottom) {
                    blob.y = bounds.bottom + (bounds.bottom - blob.y);
                    blob.verticalDirection = 1;
                }
            } else if (this.movementMode === "top to bottom") {
                blob.y -= movement;
                if (blob.y + blob.radius < -VERTICAL_LIMIT - TOP_MARGIN)
                    this.createBlob(i, true);
            } else {
                blob.y += movement;
                if (blob.y - blob.radius > VERTICAL_LIMIT + TOP_MARGIN)
                    this.createBlob(i, true);
            }
        }

        this.uniforms.uTime.value = this.time;
        this.uniforms.uFusionStrength.value = this.fusionStrength;
        this.uniforms.uGlowEnabled.value = this.glowEnabled;
        this.uniforms.uGlowStrength.value = this.glowStrength;
        this.uniforms.uGlowRadius.value = this.glowRadius;
        this.updateBlobUniforms();
    }

    resize() {
        super.resize();
        if (!this.uniforms) return;

        this.uniforms.uResolution.value.set(this.canvas.width, this.canvas.height);
        const horizontalLimit = this.getHorizontalLimit();
        for (const blob of this.blobs) {
            const limit = Math.max(0, horizontalLimit - blob.radius * 1.1 -
                blob.swayAmplitude * this.horizontalStrength);
            blob.baseX = THREE.MathUtils.clamp(blob.baseX, -limit, limit);
        }
        this.updateBlobUniforms();
    }

    restart() {
        this.realTimeMs = 0;
        this.realTime = 0;
        this.timeMs = 0;
        this.time = 0;
        this.frame = 0;
        this.setSeed(this.seed);
        this.createBlobs();
        this.clear();
    }

    updateColors(colors, colorsAlt, bgColor) {
        super.updateColors(colors, colorsAlt, bgColor);
        this.updatePalette();
    }

    getSettings() {
        return [
            {prop: "blobCount", type: "int", min: 8, max: MAX_BLOBS, step: 1, toCall: "restart"},
            {prop: "movementMode", name: "movement", type: "select", values: MOVEMENT_MODES, toCall: "restart"},
            {prop: "movementSpeed", name: "movement speed", type: "float", min: 0.1, max: 2, step: 0.1},
            {prop: "horizontalStrength", name: "horizontal sway", type: "float", min: 0, max: 2, step: 0.1},
            {prop: "verticalSwayStrength", name: "vertical sway", type: "float", min: 0, max: 2, step: 0.1},
            {prop: "depthSwayStrength", name: "depth sway", type: "float", min: 0, max: 2, step: 0.1},
            {prop: "deformationEnabled", name: "blobs deformation", type: "bool"},
            {prop: "deformationStrength", type: "float", min: 0, max: 2, step: 0.1},
            {prop: "fusionStrength", type: "float", min: 0., max: 1, step: 0.1},
            {prop: "glowEnabled", icon: '<i class="fa-solid fa-sun"></i>', type: "bool"},
            {prop: "glowStrength", type: "float", min: 0, max: 2, step: 0.1},
            {prop: "glowRadius", type: "float", min: 0.05, max: 1, step: 0.05},
            {prop: "lightPosition", icon: '<i class="fa-solid fa-lightbulb"></i>', type: "select", values: LIGHT_POSITIONS, toCall: "updateLightDirection"},
            this.getSeedSettings()
        ];
    }
}

module.exports = LavaSlimeAnimation;
