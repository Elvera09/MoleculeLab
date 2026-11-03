import { useEffect, useRef } from "react";
import "./CosmicUniverse.css";

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotation = mat2(1.6, -1.2, 1.2, 1.6);
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p);
    p = rotation * p;
    amplitude *= 0.5;
  }
  return value;
}
float cloudMass(vec2 p, vec2 center, vec2 scale) {
  vec2 q = (p - center) / scale;
  return exp(-dot(q,q) * 1.35);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float t = u_time;

  // Broad, overlapping cloud banks define the nebula's silhouette.
  float envelope = max(max(
    cloudMass(p, vec2(-aspect*0.34, 0.18), vec2(aspect*0.42, 0.43)),
    cloudMass(p, vec2( aspect*0.34,-0.16), vec2(aspect*0.43, 0.44))),
    max(cloudMass(p, vec2(-aspect*0.04,-0.36), vec2(aspect*0.48,0.30)),
        cloudMass(p, vec2( aspect*0.02, 0.42), vec2(aspect*0.50,0.27))));

  // Domain-warped fractal noise produces soft, turbulent cloud edges.
  vec2 drift = vec2(t*0.006, -t*0.003);
  vec2 warp;
  warp.x = fbm(p*2.05 + vec2(3.1, 1.7) + drift);
  warp.y = fbm(p*2.05 + vec2(8.3, 2.8) - drift*0.8);
  vec2 warped = p*2.45 + (warp-0.5)*1.45 + drift;
  float broad = fbm(warped);
  float detail = fbm(warped*2.35 + warp*1.8 + vec2(2.0,-1.0));
  float fine = fbm(warped*5.2 - warp*2.0);
  float turbulence = broad*0.58 + detail*0.30 + fine*0.12;
  float cloud = smoothstep(0.36, 0.73, turbulence + envelope*0.20) * smoothstep(0.12,0.48,envelope);
  cloud = pow(cloud, 1.18);

  vec3 base = mix(vec3(0.012,0.014,0.035), vec3(0.018,0.026,0.065), uv.y);
  vec3 violet = vec3(0.30,0.12,0.78);
  vec3 magenta = vec3(0.68,0.16,0.57);
  vec3 blue = vec3(0.08,0.34,0.78);
  vec3 cyan = vec3(0.08,0.60,0.78);
  float colorFlow = smoothstep(-0.42,0.40,p.x + (warp.x-0.5)*0.35);
  vec3 cloudColor = mix(violet, magenta, smoothstep(0.12,0.78,colorFlow));
  cloudColor = mix(cloudColor, blue, smoothstep(0.42,0.95,uv.x)*0.62);
  cloudColor = mix(cloudColor, cyan, smoothstep(0.68,1.0,uv.x)*0.44);
  float innerGlow = smoothstep(0.60,0.91,turbulence) * cloud;
  cloudColor += vec3(0.30,0.19,0.34)*innerGlow;

  // A second, softer haze layer creates depth behind the detailed clouds.
  float haze = smoothstep(0.20,0.78,fbm(p*1.05 + drift*0.45 + warp*0.35))*envelope;
  vec3 color = base;
  color += cloudColor * cloud * 0.82;
  color += mix(vec3(0.12,0.07,0.34),vec3(0.05,0.22,0.42),uv.x) * haze * 0.22;

  // Fine illuminated cloud edges, never long ribbon strokes.
  float edge = smoothstep(0.42,0.70,turbulence) - smoothstep(0.70,0.88,turbulence);
  color += cloudColor * edge * envelope * 0.10;

  // Starfield: several scales of pinpoints with gentle twinkle.
  vec2 starUV = gl_FragCoord.xy;
  vec2 cell = floor(starUV / 4.0);
  vec2 local = fract(starUV / 4.0) - 0.5;
  float rnd = hash(cell);
  float star = smoothstep(0.985,1.0,rnd) * (1.0 - smoothstep(0.12,0.48,length(local)));
  float twinkle = 0.55 + 0.45*sin(t*1.4 + rnd*24.0);
  color += vec3(0.52,0.68,1.0) * star * twinkle * 0.75;

  float vignette = smoothstep(1.05,0.18,length(vec2((uv.x-0.5)*aspect,uv.y-0.5)));
  color *= mix(0.60,1.0,vignette);
  gl_FragColor = vec4(color,1.0);
}
`;

type Star = { x: number; y: number; r: number; phase: number; speed: number; vx: number; alpha: number };
type Node = { x: number; y: number; phase: number };

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export default function CosmicUniverse() {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detailCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = glCanvasRef.current;
    const detailCanvas = detailCanvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    const detail = detailCanvas?.getContext("2d");
    if (!canvas || !detailCanvas || !gl || !detail) return;

    let program: WebGLProgram | null = null;
    let raf = 0;
    let width = 0, height = 0, start = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars: Star[] = [];
    const nodes: Node[] = [];

    try {
      const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error("Unable to create WebGL program");
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "WebGL link failed");
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const resolution = gl.getUniformLocation(program, "u_resolution");
      const time = gl.getUniformLocation(program, "u_time");
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = Math.floor(width*dpr); canvas.height = Math.floor(height*dpr);
        detailCanvas.width = Math.floor(width*dpr); detailCanvas.height = Math.floor(height*dpr);
        canvas.style.width = detailCanvas.style.width = `${width}px`;
        canvas.style.height = detailCanvas.style.height = `${height}px`;
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.uniform2f(resolution,canvas.width,canvas.height);
        detail.setTransform(dpr,0,0,dpr,0,0);
        stars.length = 0; nodes.length = 0;
        const count = Math.min(190,Math.max(90,Math.floor(width*height/8500)));
        for(let i=0;i<count;i++) stars.push({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.15+.35,phase:Math.random()*6.28,speed:.4+Math.random()*1.3,vx:(Math.random()-.5)*.10,alpha:.25+Math.random()*.65});
        for(let group=0;group<4;group++){
          const cx=group%2===0?width*.08:width*.92, cy=height*(.22+group*.18);
          for(let i=0;i<6;i++) nodes.push({x:cx+Math.sin(i*2.3+group)*35,y:cy+Math.cos(i*1.7+group)*28,phase:i+group});
        }
      };

      const drawDetails = (elapsed:number) => {
        detail.clearRect(0,0,width,height);
        for(const s of stars){
          if(!reduced){s.x+=s.vx*16;if(s.x<0)s.x=width;if(s.x>width)s.x=0;}
          const pulse=reduced?.7:.55+.45*Math.sin(elapsed*.001*s.speed+s.phase);
          detail.beginPath(); detail.fillStyle=`rgba(215,235,255,${s.alpha*pulse})`;
          detail.arc(s.x,s.y,s.r,0,Math.PI*2); detail.fill();
          if(s.r>1.25){detail.strokeStyle=`rgba(160,205,255,${s.alpha*pulse*.28})`;detail.lineWidth=.6;detail.beginPath();detail.moveTo(s.x-4,s.y);detail.lineTo(s.x+4,s.y);detail.moveTo(s.x,s.y-4);detail.lineTo(s.x,s.y+4);detail.stroke();}
        }
        // Small molecular constellations sit near the edges, leaving the workspace readable.
        for(let group=0;group<4;group++){
          const pts=nodes.slice(group*6,group*6+6);
          detail.strokeStyle="rgba(113,210,255,.24)"; detail.lineWidth=.8;
          for(let i=0;i<pts.length-1;i++){detail.beginPath();detail.moveTo(pts[i].x,pts[i].y);detail.lineTo(pts[i+1].x,pts[i+1].y);detail.stroke();}
          pts.forEach((p,i)=>{const glow=.65+.35*Math.sin(elapsed*.001+p.phase);detail.beginPath();detail.fillStyle=i%3===0?`rgba(199,160,255,${glow})`:`rgba(126,226,255,${glow})`;detail.shadowBlur=9;detail.shadowColor="#73cfff";detail.arc(p.x,p.y,1.6*glow,0,Math.PI*2);detail.fill();detail.shadowBlur=0;});
        }
      };
      const draw = (now:number) => {
        const elapsed = reduced ? 0 : now-start;
        gl.useProgram(program);
        gl.uniform1f(time,elapsed*.001);
        gl.drawArrays(gl.TRIANGLES,0,6);
        drawDetails(elapsed);
        if(!reduced) raf=window.requestAnimationFrame(draw);
      };
      resize();
      window.addEventListener("resize",resize);
      if(reduced) draw(start); else raf=window.requestAnimationFrame(draw);
      const visibility=()=>{if(document.hidden)cancelAnimationFrame(raf);else if(!reduced)raf=window.requestAnimationFrame(draw);};
      document.addEventListener("visibilitychange",visibility);
      return ()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibility);if(program)gl.deleteProgram(program);};
    } catch (error) {
      console.error("MoleculeLab cosmic renderer:",error);
      // Keep the app usable if WebGL is unavailable; CSS supplies a quiet fallback.
      return () => { if(program) gl.deleteProgram(program); };
    }
  },[]);

  return <div className="cosmic-universe" aria-hidden="true"><canvas ref={glCanvasRef} className="cosmic-universe__canvas"/><canvas ref={detailCanvasRef} className="cosmic-universe__details"/></div>;
}
