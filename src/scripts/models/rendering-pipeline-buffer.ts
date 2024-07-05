import { FrameBuffer } from "./frame-buffer";
import { Quad } from "./geometry/quad";
import { Shader } from "./shader";

export class RenderingPipelineBuffer {

	private frameBuffer0: FrameBuffer;
	private frameBuffer1: FrameBuffer;
	private filters: Shader[] = [];
	private pingPong = false;

	constructor(private gl: WebGLContext) {
		this.frameBuffer0 = new FrameBuffer(this.gl);
		this.frameBuffer1 = new FrameBuffer(this.gl);
	}

	private get primary() {
		return this.pingPong ? this.frameBuffer1 : this.frameBuffer0;
	}

	private get secondary() {
		return this.pingPong ? this.frameBuffer0 : this.frameBuffer1;
	}

	public async addFilter(name: string) {
		const filter = new Shader(this.gl, `filter-${name}`);
		await filter.setup({
			source: {
				vertex: "vertex-passthrough",
				fragment: `filters/${name}`
			},
			uniforms: ["u_texture", "u_depth"],
			buffers: {
				vertex: {
					data: Quad.vertices,
					attribute: "a_position"
				},
				uv: {
					data: Quad.textureCoordinates,
					attribute: "a_texcoord"
				},
				index: {
					data: Quad.indices,
					target: GL.ELEMENT_ARRAY_BUFFER,
				}
			}
		});

		filter.bind();
		filter.setUniform("u_texture", 0);
		filter.bindBuffer("index", Quad.indices);

		this.filters.push(filter);
	}

	public swap() {
		this.pingPong = !this.pingPong;
	}

	public bind() {
		if (this.filters.length > 0) this.primary.bind();
	}

	public unbind() {
		if (this.filters.length > 0) this.primary.unbind();
	}

	public resize() {
		this.frameBuffer0.resize();
		this.frameBuffer1.resize();
	}

	public bindTexture() {
		this.primary.bindTexture();
	}

	public commit() {
		// After drawing to the primary frame buffer this is called
		// So apply the filters alternating between the two frame buffers
		for (let i = 0; i < this.filters.length; i++) {
			const filter = this.filters[i];
			const lastFilter = i === this.filters.length - 1;

			if (!lastFilter) this.secondary.bind();
			this.primary.bindTexture();
			filter.bind();
			this.gl.drawElements(GL.TRIANGLES, Quad.indices.length, GL.UNSIGNED_SHORT, 0);

			if (!lastFilter) {
				this.secondary.blit(false);
				this.secondary.unbind();
				this.swap();
			}
		}

		this.primary.blit(true);

	}

}