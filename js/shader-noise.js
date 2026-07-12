'use strict';

/*
 * GLSL implementation of classic Perlin noise based on noise.js.
 * Permutation array was replaced with the compact polynomial hash.
 */

const SHADER_NOISE = `
    float permutation(float index) {
        return mod(((index * 34.0) + 1.0) * index, 289.0);
    }

    vec3 gradient(float index) {
        float i = mod(index, 12.0);
        if (i < 1.0) return vec3(1.0, 1.0, 0.0);
        if (i < 2.0) return vec3(-1.0, 1.0, 0.0);
        if (i < 3.0) return vec3(1.0, -1.0, 0.0);
        if (i < 4.0) return vec3(-1.0, -1.0, 0.0);
        if (i < 5.0) return vec3(1.0, 0.0, 1.0);
        if (i < 6.0) return vec3(-1.0, 0.0, 1.0);
        if (i < 7.0) return vec3(1.0, 0.0, -1.0);
        if (i < 8.0) return vec3(-1.0, 0.0, -1.0);
        if (i < 9.0) return vec3(0.0, 1.0, 1.0);
        if (i < 10.0) return vec3(0.0, -1.0, 1.0);
        if (i < 11.0) return vec3(0.0, 1.0, -1.0);
        return vec3(0.0, -1.0, -1.0);
    }

    float fade(float t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
    }

    float perlin2(vec2 P) {
        vec2 cell = floor(P);
        vec2 point = P - cell;
        cell = mod(cell, 256.0);

        float n00 = dot(gradient(permutation(cell.x + permutation(cell.y))).xy, point);
        float n01 = dot(gradient(permutation(cell.x + permutation(cell.y + 1.0))).xy, point - vec2(0.0, 1.0));
        float n10 = dot(gradient(permutation(cell.x + 1.0 + permutation(cell.y))).xy, point - vec2(1.0, 0.0));
        float n11 = dot(gradient(permutation(cell.x + 1.0 + permutation(cell.y + 1.0))).xy, point - vec2(1.0));

        float u = fade(point.x);
        return mix(mix(n00, n10, u), mix(n01, n11, u), fade(point.y));
    }

    float perlin3(vec3 P) {
        vec3 cell = floor(P);
        vec3 point = P - cell;
        cell = mod(cell, 256.0);

        float yz00 = permutation(cell.y + permutation(cell.z));
        float yz01 = permutation(cell.y + permutation(cell.z + 1.0));
        float yz10 = permutation(cell.y + 1.0 + permutation(cell.z));
        float yz11 = permutation(cell.y + 1.0 + permutation(cell.z + 1.0));

        float n000 = dot(gradient(permutation(cell.x + yz00)), point);
        float n001 = dot(gradient(permutation(cell.x + yz01)), point - vec3(0.0, 0.0, 1.0));
        float n010 = dot(gradient(permutation(cell.x + yz10)), point - vec3(0.0, 1.0, 0.0));
        float n011 = dot(gradient(permutation(cell.x + yz11)), point - vec3(0.0, 1.0, 1.0));
        float n100 = dot(gradient(permutation(cell.x + 1.0 + yz00)), point - vec3(1.0, 0.0, 0.0));
        float n101 = dot(gradient(permutation(cell.x + 1.0 + yz01)), point - vec3(1.0, 0.0, 1.0));
        float n110 = dot(gradient(permutation(cell.x + 1.0 + yz10)), point - vec3(1.0, 1.0, 0.0));
        float n111 = dot(gradient(permutation(cell.x + 1.0 + yz11)), point - vec3(1.0));

        float u = fade(point.x);
        float v = fade(point.y);
        float w = fade(point.z);
        return mix(
            mix(mix(n000, n100, u), mix(n001, n101, u), w),
            mix(mix(n010, n110, u), mix(n011, n111, u), w),
            v
        );
    }
`

module.exports = SHADER_NOISE;
