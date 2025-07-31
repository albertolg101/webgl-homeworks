export function addNoiseToPlaneGeometry(noise, geometry, offset) {
    console.log(geometry.attributes.position)
    for(let i = 0 ; i < geometry.attributes.position.count ; i++) {
        const x = geometry.attributes.position.getX(i);
        const y = geometry.attributes.position.getY(i);
        if (-50 !== i && i !== 50 && 50 !== y && y !== 50) {
            const z = noise(x + offset, y) * 0.1;
            geometry.attributes.position.setZ(i, z);
        } else {
            geometry.attributes.position.setZ(i, 0);
        }
    }
    geometry.computeVertexNormals();
}