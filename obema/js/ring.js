/* O "O" da OBEMA: anel cromado em raymarching (WebGL 1, sem dependências). */
(function () {
  'use strict';

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uPtr;uniform float uScroll;uniform float uIntro;',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    'float map(vec3 p){',
    '  float k=mix(.62,1.,uIntro);p/=k;',
    '  p.yz*=rot(1.05+uPtr.y*.32+uScroll*1.6);',
    '  p.xz*=rot(uTime*.16+uPtr.x*.55+uScroll*.8);',
    '  p.xy*=rot(.42+sin(uTime*.21)*.16);',
    '  float a=atan(p.z,p.x);',
    '  p.y+=.2*sin(2.*a+uTime*.6);',
    '  float r=.33+.11*sin(3.*a-uTime*.75)+.045*sin(5.*a+uTime*1.1);',
    '  vec2 q=vec2(length(p.xz)-1.02,p.y);',
    '  q=rot(a*1.5+uTime*.35)*q;',
    '  q.x*=.78;',
    '  return (length(q)-r)*.58*k;',
    '}',
    'vec3 nrm(vec3 p){vec2 e=vec2(.0016,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}',
    'vec3 env(vec3 r){',
    '  float y=r.y;',
    '  vec3 c=mix(vec3(.012,.03,.07),vec3(.1,.17,.31),smoothstep(-.7,.9,y));',
    '  c+=vec3(.96,.98,1.)*smoothstep(.5,.72,y)*smoothstep(1.02,.86,y)*1.25;',
    '  c+=vec3(.86,.91,1.)*smoothstep(.82,.95,abs(r.x))*smoothstep(.62,0.,abs(y-.05))*1.15;',
    '  c+=vec3(.79,.94,.24)*pow(max(dot(r,normalize(vec3(-.75,-.5,.45))),0.),6.)*.75;',
    '  c+=vec3(.42,.5,.95)*pow(max(dot(r,normalize(vec3(.85,-.25,.5))),0.),3.)*.6;',
    '  c+=vec3(.72,.62,.95)*pow(max(dot(r,normalize(vec3(.2,.35,-.9))),0.),4.)*.35;',
    '  return c;',
    '}',
    'void main(){',
    '  float m=min(uRes.x,uRes.y);',
    '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/m;',
    '  vec3 ro=vec3(0.,0.,4.5);vec3 rd=normalize(vec3(uv,-1.55));',
    '  float t=0.,d=1.,md=9.,tm=0.;',
    '  for(int i=0;i<90;i++){d=map(ro+rd*t);if(d<md){md=d;tm=t;}if(d<.0011||t>8.)break;t+=d;}',
    '  bool hit=d<.004;',
    '  float pw=tm*1.4/(m*1.55);',
    '  float cov=hit?1.:1.-smoothstep(0.,pw,md);',
    '  if(cov<=0.){gl_FragColor=vec4(0.);return;}',
    '  vec3 p=ro+rd*(hit?t:tm);vec3 n=nrm(p);vec3 r=reflect(rd,n);',
    '  float nv=max(dot(n,-rd),0.);float fr=pow(1.-nv,3.);',
    '  vec3 col=env(r);',
    '  vec3 film=.5+.5*cos(6.2831*(vec3(.05,.3,.6)+nv*1.1+.2));',
    '  col=mix(col,col*film*1.5,.13);',
    '  col+=fr*vec3(.79,.94,.24)*.16;',
    '  col+=pow(max(dot(r,normalize(vec3(.55,.8,.55))),0.),80.)*1.6;',
    '  col*=.78+.22*n.y;',
    '  col=col/(1.+col);col=pow(col,vec3(.4545));',
    '  gl_FragColor=vec4(col*cov,cov);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[ring] shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function ObemaRing(canvas, opts) {
    opts = opts || {};
    var gl;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      ptr: gl.getUniformLocation(prog, 'uPtr'),
      scroll: gl.getUniformLocation(prog, 'uScroll'),
      intro: gl.getUniformLocation(prog, 'uIntro')
    };

    var quality = Math.min((window.devicePixelRatio || 1) * 1.25, 2);
    var ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    var scroll = 0, intro = opts.reduce ? 1 : 0, introTarget = 1;
    var visible = true, running = false, raf = 0, last = 0, t0 = performance.now();
    var slowFrames = 0;

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      var W = Math.max(2, Math.round(w * quality)), H = Math.max(2, Math.round(h * quality));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W; canvas.height = H;
        gl.viewport(0, 0, W, H);
      }
    }

    function draw(now) {
      var time = opts.reduce ? 6.0 : (now - t0) / 1000;
      ptr.x += (ptr.tx - ptr.x) * 0.05;
      ptr.y += (ptr.ty - ptr.y) * 0.05;
      intro += (introTarget - intro) * 0.035;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, time);
      gl.uniform2f(U.ptr, ptr.x, ptr.y);
      gl.uniform1f(U.scroll, scroll);
      gl.uniform1f(U.intro, intro);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      var dt = last ? now - last : 16;
      last = now;
      if (dt > 34) { slowFrames++; } else if (slowFrames > 0) { slowFrames--; }
      if (slowFrames > 40 && quality > 0.5) {
        quality = Math.max(0.5, quality * 0.8);
        slowFrames = 0;
        resize();
      }
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || opts.reduce) return;
      running = true; last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function sync() {
      if (visible && !document.hidden) start(); else stop();
    }

    resize();
    draw(performance.now());

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { resize(); if (!running) draw(performance.now()); }).observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', sync);
    sync();

    return {
      pointer: function (x, y) { ptr.tx = x; ptr.ty = y; },
      scroll: function (v) { scroll = v; if (!running) draw(performance.now()); }
    };
  }

  window.ObemaRing = ObemaRing;
})();
