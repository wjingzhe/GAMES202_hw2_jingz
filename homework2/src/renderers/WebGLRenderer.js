class WebGLRenderer {
    meshes = [];
    shadowMeshes = [];
    lights = [];

    constructor(gl, camera) {
        this.gl = gl;
        this.camera = camera;
    }

    addLight(light) {
        this.lights.push({
            entity: light,
            meshRender: new MeshRender(this.gl, light.mesh, light.mat)
        });
    }
    addMeshRender(mesh) { this.meshes.push(mesh); }
    addShadowMeshRender(mesh) { this.shadowMeshes.push(mesh); }

    render() {
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        console.assert(this.lights.length != 0, "No light");
        console.assert(this.lights.length == 1, "Multiple lights");

        const timer = Date.now() * 0.0001;

        for (let l = 0; l < this.lights.length; l++) {
            // Draw light
            this.lights[l].meshRender.mesh.transform.translate = this.lights[l].entity.lightPos;
            this.lights[l].meshRender.draw(this.camera);

            // Shadow pass
            if (this.lights[l].entity.hasShadowMap == true) {
                for (let i = 0; i < this.shadowMeshes.length; i++) {
                    this.shadowMeshes[i].draw(this.camera);
                }
            }

            // Camera pass
            for (let i = 0; i < this.meshes.length; i++) {
                this.gl.useProgram(this.meshes[i].shader.program.glShaderProgram);
                this.gl.uniform3fv(this.meshes[i].shader.program.uniforms.uLightPos, this.lights[l].entity.lightPos);

                for (let k in this.meshes[i].material.uniforms) {//逐个顶点绑定旋转后的PrecomputeL系数，分RGB共3分部，名义上是矩阵类型

                    let cameraModelMatrix = mat4.create();
                    // Edit Start
                    mat4.fromRotation(cameraModelMatrix, timer, [0, 1, 0]);
                    // Edit End

                    if (k == 'uMoveWithCamera') { // The rotation of the skybox
                        gl.uniformMatrix4fv(
                            this.meshes[i].shader.program.uniforms[k],
                            false,
                            cameraModelMatrix);
                    }

                    // Bonus - Fast Spherical Harmonic Rotation
                    let precomputeL_RGBMat3 = getRotationPrecomputeL(precomputeL[guiParams.envmapId], cameraModelMatrix);//讲旋转之后的光照信息计算出来，9行对应9个系数，RGB各自3分量
                    
                    // Edit Start
                    //let Mat3Value = getMat3ValueFromRGB(precomputeL[guiParams.envmapId])
                    let Mat3Value = getMat3ValueFromRGB(precomputeL_RGBMat3)//光照部分L，分R,G,B各自有自己的光照系数,把9各系数xRGB的矩阵重新填充成对应的矩阵数组形式，便于VS绑定使用
                    for(let j = 0; j < 3; j++){//R,G,B
                        if (k == 'uPrecomputeL['+j+']') {
                            //讲旋转后的光照绑定到shader属性中，和之前lightTranspose用同一套shader计算即可
                            gl.uniformMatrix3fv(
                                this.meshes[i].shader.program.uniforms[k],
                                false,
                                Mat3Value[j]);
                        }
                    }
                    // Edit End
                    
                }

                this.meshes[i].draw(this.camera);
            }
        }

    }
}