import { useEffect, useRef } from 'react';

interface GrainientProps {
  color1?: string;
  color2?: string;
  color3?: string;
  timeSpeed?: number;
  warpStrength?: number;
  warpFrequency?: number;
  warpSpeed?: number;
  warpAmplitude?: number;
  blendAngle?: number;
  blendSoftness?: number;
  rotationAmount?: number;
  noiseScale?: number;
  grainAmount?: number;
  grainScale?: number;
  contrast?: number;
  gamma?: number;
  saturation?: number;
  zoom?: number;
  className?: string;
}

function hexToVec3(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_timeSpeed;
uniform float u_warpStrength;
uniform float u_warpFrequency;
uniform float u_warpSpeed;
uniform float u_warpAmplitude;
uniform float u_blendAngle;
uniform float u_blendSoftness;
uniform float u_rotationAmount;
uniform float u_noiseScale;
uniform float u_grainAmount;
uniform float u_grainScale;
uniform float u_contrast;
uniform float u_gamma;
uniform float u_saturation;
uniform float u_zoom;

// Simplex-style noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    val += amp * snoise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

// Hash for grain
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time * u_timeSpeed;

  // Center and zoom
  vec2 centered = (uv - 0.5) / u_zoom + 0.5;

  // Aspect correction
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (centered - 0.5) * vec2(aspect, 1.0);

  // Rotation
  float angle = t * 0.1 * u_rotationAmount / 500.0;
  float ca = cos(angle), sa = sin(angle);
  p = mat2(ca, -sa, sa, ca) * p;

  // Warp displacement
  vec2 warpUV = p * u_warpFrequency;
  float warpT = t * u_warpSpeed;
  vec2 warp = vec2(
    snoise(warpUV + vec2(warpT, 0.0)),
    snoise(warpUV + vec2(0.0, warpT + 43.0))
  ) * u_warpStrength * u_warpAmplitude / 50.0;
  p += warp * 0.01;

  // Noise field for color mixing
  float n1 = fbm(p * u_noiseScale + vec2(t * 0.3, 0.0));
  float n2 = fbm(p * u_noiseScale * 1.3 + vec2(0.0, t * 0.2 + 100.0));
  float n3 = fbm(p * u_noiseScale * 0.7 + vec2(t * 0.15 + 200.0, t * 0.1));

  // Blend angle
  float ba = u_blendAngle * 3.14159 / 180.0;
  float grad = dot(p, vec2(cos(ba), sin(ba)));
  grad = smoothstep(-u_blendSoftness - 0.5, u_blendSoftness + 0.5, grad);

  // Mix colors
  float mix1 = smoothstep(-0.3, 0.6, n1) * (1.0 - grad);
  float mix2 = smoothstep(-0.2, 0.7, n2) * grad;
  float mix3 = smoothstep(-0.4, 0.5, n3);

  vec3 col = u_color1;
  col = mix(col, u_color2, mix1);
  col = mix(col, u_color3, mix2);
  col = mix(col, (u_color1 + u_color3) * 0.5, mix3 * 0.4);

  // Post-processing
  col = pow(col, vec3(1.0 / u_gamma));
  col = (col - 0.5) * u_contrast + 0.5;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, u_saturation);

  // Grain
  vec2 grainUV = gl_FragCoord.xy / u_grainScale;
  float grain = (hash(grainUV + fract(t * 7.0)) - 0.5) * u_grainAmount;
  col += grain;

  col = clamp(col, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}`;

export function Grainient({
  color1 = '#93b4ff',
  color2 = '#7c6ddc',
  color3 = '#c4b5fd',
  timeSpeed = 0.25,
  warpStrength = 1,
  warpFrequency = 5,
  warpSpeed = 2,
  warpAmplitude = 50,
  blendAngle = 0,
  blendSoftness = 0.05,
  rotationAmount = 500,
  noiseScale = 2,
  grainAmount = 0.1,
  grainScale = 2,
  contrast = 1.5,
  gamma = 1,
  saturation = 1,
  zoom = 0.9,
  className = '',
}: GrainientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) return;

    // Compile shaders
    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uTime = u('u_time');
    const uRes = u('u_resolution');
    const uC1 = u('u_color1');
    const uC2 = u('u_color2');
    const uC3 = u('u_color3');
    const uTimeSpeed = u('u_timeSpeed');
    const uWarpStr = u('u_warpStrength');
    const uWarpFreq = u('u_warpFrequency');
    const uWarpSpd = u('u_warpSpeed');
    const uWarpAmp = u('u_warpAmplitude');
    const uBlendAng = u('u_blendAngle');
    const uBlendSoft = u('u_blendSoftness');
    const uRotAmt = u('u_rotationAmount');
    const uNoiseScl = u('u_noiseScale');
    const uGrainAmt = u('u_grainAmount');
    const uGrainScl = u('u_grainScale');
    const uContrast = u('u_contrast');
    const uGamma = u('u_gamma');
    const uSat = u('u_saturation');
    const uZoom = u('u_zoom');

    const c1 = hexToVec3(color1);
    const c2 = hexToVec3(color2);
    const c3 = hexToVec3(color3);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    function render() {
      const t = (performance.now() - start) / 1000;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform3f(uC1, c1[0], c1[1], c1[2]);
      gl!.uniform3f(uC2, c2[0], c2[1], c2[2]);
      gl!.uniform3f(uC3, c3[0], c3[1], c3[2]);
      gl!.uniform1f(uTimeSpeed, timeSpeed);
      gl!.uniform1f(uWarpStr, warpStrength);
      gl!.uniform1f(uWarpFreq, warpFrequency);
      gl!.uniform1f(uWarpSpd, warpSpeed);
      gl!.uniform1f(uWarpAmp, warpAmplitude);
      gl!.uniform1f(uBlendAng, blendAngle);
      gl!.uniform1f(uBlendSoft, blendSoftness);
      gl!.uniform1f(uRotAmt, rotationAmount);
      gl!.uniform1f(uNoiseScl, noiseScale);
      gl!.uniform1f(uGrainAmt, grainAmount);
      gl!.uniform1f(uGrainScl, grainScale);
      gl!.uniform1f(uContrast, contrast);
      gl!.uniform1f(uGamma, gamma);
      gl!.uniform1f(uSat, saturation);
      gl!.uniform1f(uZoom, zoom);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [color1, color2, color3, timeSpeed, warpStrength, warpFrequency, warpSpeed, warpAmplitude, blendAngle, blendSoftness, rotationAmount, noiseScale, grainAmount, grainScale, contrast, gamma, saturation, zoom]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
