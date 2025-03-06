{
    id: 'showcase14',
    name: 'Slime',
    description: 'Interactive raymarched slime with dynamic deformation',
    shaders: {
        vertex: 'showcase14/slime.vert',
        fragment: 'showcase14/slime.frag'
    },
    uniforms: {
        uResolution: 'vec2',
        uTime: 'float',
        uIntensity: 'float'
    },
    defaultUniforms: {
        uIntensity: 1.0
    }
} 