module.exports = {

    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomElement: function(arr) {
        return arr[Math.floor(Math.random() * (arr.length + 1))];
    },

    // Function to linearly interpolate between v1 and v2
    lerp: function(v1, v2, t) {
        return (1.0 - t) * v1 + t * v2;
    },

    arrayCopy: function(dest, destPos, src, srcPos, size) {
        for (var i = 0; i < size; ++i)
            dest[destPos++] = src[srcPos++];
    },

    arraySet: function(dest, destPos, value, size) {
        for (var i = 0; i < size; ++i)
            dest[destPos++] = value;
    },

    arrayDist2D: function(arrA, posA, arrB, posB) {
        var dx = arrA[posA] - arrB[posB];
        var dy = arrA[posA + 1] - arrB[posB + 1];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    arrayDist3D: function(arrA, posA, arrB, posB) {
        var dx = arrA[posA] - arrB[posB];
        var dy = arrA[posA + 1] - arrB[posB + 1];
        var dz = arrA[posA + 2] - arrB[posB + 2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    arrayCreate: function(arrType, arrShape) {
        var dimSize = arrShape[0];
        var arr = new arrType(dimSize);
        var nextShape = shape.slice(1);
        for (var i = 0; i < dimSize; ++i)
            arr[i] = arrayCreate(arrType, nextShape);
        return arr;
    }

};
