precision mediump float;

uniform sampler2D u_image;//texture array

varying vec2 v_texCoord;
uniform vec2 u_textureSize;

uniform vec2 u_mouseCoord;

void main() {

    vec2 onePixel = vec2(1.0, 1.0)/u_textureSize;

    vec2 pxDistFromMouse = (v_texCoord - u_mouseCoord)*(v_texCoord - u_mouseCoord)/onePixel;

    float tol = 0.005;
    if (pxDistFromMouse.x < tol && pxDistFromMouse.y < tol){
        gl_FragColor = vec4(1.0,1.0,1.0,1);
        return;
    }



    vec4 rawTextureData = texture2D(u_image, v_texCoord);

    int count = 0;
    for (int i=-1;i<2;i++){
        for (int j=-1;j<2;j++){
            if (i == 0 && j == 0) continue;
            vec2 neighborCoord = v_texCoord + vec2(onePixel.x*float(i), onePixel.y*float(j));
            if (vec4(texture2D(u_image, neighborCoord)).r == 1.0) count++;
        }
    }


    if (count == 3) {
        gl_FragColor = vec4(1.0,1.0,1.0,1);
        return;
    }
    if (rawTextureData.x == 1.0 && count == 2){
        gl_FragColor = vec4(1.0,1.0,1.0,1);
        return;
    }
    gl_FragColor = vec4(0,0,0,1);
}
