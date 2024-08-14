// PRTMaterial.js

class PRTMaterial extends Material{
    constructor(vertexShader,fragmentShader){
        super(
            {
                'uPrecomputeL[0]': { type: 'precomputeL', value: null},//R
                'uPrecomputeL[1]': { type: 'precomputeL', value: null},//G
                'uPrecomputeL[2]': { type: 'precomputeL', value: null},//B
            },
            ['aPrecomputeLT'],
            vertexShader,
            fragmentShader,
            null
        );
    }//constructor

   
} 

async function buildPRTMaterial(vertexPath,fragmentPath) {
    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new PRTMaterial(vertexShader,fragmentShader);
}