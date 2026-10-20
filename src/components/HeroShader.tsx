import React, { useEffect, useRef, useState } from 'react';

interface HeroShaderProps {
  className?: string;
  intensity?: number;
}

export const HeroShader: React.FC<HeroShaderProps> = ({ className = '', intensity = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsPaused(true);
    }

    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      setIsSupported(false);
      return;
    }

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_intensity;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187,
                              0.366025403784439,
                             -0.577350269189626,
                              0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
      }

      void main() {
          vec2 st = gl_FragCoord.xy / u_resolution.xy;
          st.x *= u_resolution.x / u_resolution.y;

          float t = u_time * 0.18;
          vec2 mouse = u_mouse / u_resolution.xy;

          float n1 = snoise(st * 1.5 + vec2(t * 0.3, t * 0.2));
          float n2 = snoise(st * 3.2 - vec2(t * 0.2, -t * 0.4) + vec2(n1 * 0.6));
          float n3 = snoise(st * 6.0 + vec2(n2 * 0.4, t * 0.1));

          float combined = (n1 * 0.5 + n2 * 0.35 + n3 * 0.15) * 0.5 + 0.5;
          
          vec2 center = vec2(0.5 * (u_resolution.x / u_resolution.y), 0.75);
          float dist = distance(st, center);
          float glow = exp(-dist * 1.8) * 1.4;

          vec3 colDark = vec3(0.03, 0.04, 0.07);
          vec3 colIndigo = vec3(0.12, 0.14, 0.38);
          vec3 colAmber = vec3(0.96, 0.52, 0.12);
          vec3 colBright = vec3(1.0, 0.85, 0.45);

          vec3 col = mix(colDark, colIndigo, smoothstep(0.1, 0.6, combined * glow));
          col = mix(col, colAmber, smoothstep(0.45, 0.85, combined * glow));
          col = mix(col, colBright, smoothstep(0.78, 1.1, combined * glow));

          float mouseDist = distance(gl_FragCoord.xy / u_resolution.xy, mouse);
          col += vec3(0.95, 0.45, 0.1) * exp(-mouseDist * 6.0) * 0.35;

          gl_FragColor = vec4(col * u_intensity, 1.0);
      }
    `;

    function compileShader(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vShader = compileShader(gl.VERTEX_SHADER, vs);
    const fShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vShader || !fShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    let animId: number;
    let startTime = performance.now();

    function render(t: number) {
      if (!gl || !canvas) return;
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, (t - startTime) * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      if (uIntensity) gl.uniform1f(uIntensity, intensity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [intensity, isPaused]);

  if (!isSupported) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-[#0c1020] via-[#1a1329] to-[#251206] ${className}`} />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-hidden="true"
      />
    </div>
  );
};
