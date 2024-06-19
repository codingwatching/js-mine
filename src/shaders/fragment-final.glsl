#version 300 es

precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
	fragColor = texture(u_texture, v_texCoord);
	fragColor = vec4(1.0);
}