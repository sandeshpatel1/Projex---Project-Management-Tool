import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function FloatingOrbs({ theme }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const vsrc = `attribute vec2 a_pos; void main(){gl_Position=vec4(a_pos,0.0,1.0);}`;
    const fsrc = `
      precision mediump float;
      uniform vec2 u_res; uniform float u_time; uniform int u_dark;
      float orb(vec2 uv,vec2 c,float r){return smoothstep(r,r*0.1,length(uv-c));}
      void main(){
        vec2 uv=(gl_FragCoord.xy/u_res)*2.0-1.0; uv.x*=u_res.x/u_res.y;
        float t=u_time*0.28;
        vec2 p1=vec2(sin(t*0.7)*0.62,cos(t*0.5)*0.52);
        vec2 p2=vec2(cos(t*0.4)*0.72,sin(t*0.8)*0.58);
        vec2 p3=vec2(sin(t*0.9)*0.5,cos(t*0.3)*0.68);
        float o1=orb(uv,p1,0.55),o2=orb(uv,p2,0.45),o3=orb(uv,p3,0.5);
        float blend=clamp(o1+o2+o3,0.0,1.0);
        vec3 c1,c2,c3,bg;
        if(u_dark==1){c1=vec3(0.38,0.4,0.95);c2=vec3(0.55,0.2,0.9);c3=vec3(0.1,0.7,0.85);bg=vec3(0.05,0.05,0.12);}
        else{c1=vec3(0.55,0.65,1.0);c2=vec3(0.75,0.55,1.0);c3=vec3(0.4,0.85,1.0);bg=vec3(0.9,0.92,1.0);}
        vec3 mc=c1*o1+c2*o2+c3*o3; mc/=(o1+o2+o3+0.001);
        gl_FragColor=vec4(mix(bg,mc,blend*0.6),1.0);
      }
    `;
    function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
    const prog=gl.createProgram();
    gl.attachShader(prog,compile(gl.VERTEX_SHADER,vsrc));
    gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fsrc));
    gl.linkProgram(prog);gl.useProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const aPos=gl.getAttribLocation(prog,'a_pos');
    const uRes=gl.getUniformLocation(prog,'u_res');
    const uTime=gl.getUniformLocation(prog,'u_time');
    const uDark=gl.getUniformLocation(prog,'u_dark');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
    const start=performance.now();
    function render(){
      const t=(performance.now()-start)/1000;
      gl.uniform2f(uRes,canvas.width,canvas.height);
      gl.uniform1f(uTime,t);
      gl.uniform1i(uDark,theme==='dark'?1:0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      animRef.current=requestAnimationFrame(render);
    }
    render();
    return ()=>{cancelAnimationFrame(animRef.current);window.removeEventListener('resize',resize);};
  }, [theme]);

  return <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',display:'block'}} />;
}

function Particles({ theme }) {
  const items = Array.from({ length: 16 }, (_, i) => ({
    size:  3 + (i * 1.7) % 5,
    delay: (i * 1.3) % 9,
    dur:   6 + (i * 0.9) % 10,
    x:     (i * 6.25) % 100,
  }));
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      {items.map((p, i) => (
        <div key={i} style={{
          position:'absolute', left:`${p.x}%`, bottom:'-10px',
          width:p.size, height:p.size, borderRadius:'50%',
          background: theme==='dark'
            ? `rgba(99,102,241,${0.3 + (i%5)*0.12})`
            : `rgba(99,102,241,${0.2 + (i%5)*0.1})`,
          animation:`floatUpP ${p.dur}s ${p.delay}s infinite ease-in-out`,
        }}/>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode]        = useState('login');
  const [loading, setLoading]  = useState(false);
  const [showPass, setShowPass]= useState(false);
  const [form, setForm]        = useState({ name:'', email:'', password:'' });
  const [errors, setErrors]    = useState({});
  const [mounted, setMounted]  = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const isDark = theme === 'dark';

  const validate = () => {
    const e = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await loginWithGoogle(); toast.success('Welcome to Projex!'); }
    catch (err) { toast.error(err.message || 'Google sign-in failed'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') { await loginWithEmail(form.email, form.password); toast.success('Welcome back!'); }
      else { await registerWithEmail(form.email, form.password, form.name); toast.success('Account created!'); }
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found'        ? 'No account found with this email'
        : err.code === 'auth/wrong-password'       ? 'Incorrect password'
        : err.code === 'auth/email-already-in-use' ? 'Email already in use'
        : err.code === 'auth/weak-password'        ? 'Password too weak'
        : err.message;
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const switchMode = () => { setMode(m => m === 'login' ? 'register' : 'login'); setErrors({}); };

  return (
    <div className={`lp-root${isDark ? '' : ' lp-light'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes floatUpP{0%{transform:translateY(0) scale(1);opacity:0;}10%{opacity:0.8;}90%{opacity:0.3;}100%{transform:translateY(-100vh) scale(0.4);opacity:0;}}
        @keyframes lpFadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
        @keyframes modeSlide{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes ldots{0%,80%,100%{opacity:.2;transform:scale(.8);}40%{opacity:1;transform:scale(1);}}

        .lp-root{
          min-height:100vh; display:flex; align-items:stretch;
          font-family:'DM Sans',sans-serif;
          background:#080816; color:#f0f0ff;
          position:relative; overflow:hidden;
          transition:background .5s ease, color .5s ease;
        }
        .lp-root.lp-light { background:#eef0ff; color:#1a1a2e; }

        /* Panels */
        .lp-visual{
          flex:1; position:relative; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
        }
        @media(max-width:900px){.lp-visual{display:none;}}

        .lp-vis-inner{
          position:relative;z-index:2;
          padding:48px; max-width:480px;
        }
        .lp-tag{
          display:inline-flex;align-items:center;gap:7px;
          padding:6px 14px;border-radius:99px;
          font-size:.76rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
          margin-bottom:28px;backdrop-filter:blur(12px);
        }
        .lp-root .lp-tag{background:rgba(99,102,241,.18);color:#a5b4fc;border:1px solid rgba(99,102,241,.3);}
        .lp-root.lp-light .lp-tag{background:rgba(99,102,241,.1);color:#4f46e5;border:1px solid rgba(99,102,241,.25);}

        .lp-vis-title{
          font-family:'Syne',sans-serif;
          font-size:clamp(2rem,3vw,3rem);font-weight:800;
          line-height:1.15;margin-bottom:18px;letter-spacing:-.04em;
        }
        .lp-root .lp-vis-title{color:#f0f0ff;}
        .lp-root.lp-light .lp-vis-title{color:#1a1a2e;}

        .lp-accent{
          background:linear-gradient(135deg,#6366f1,#a855f7);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .lp-vis-desc{font-size:1rem;line-height:1.7;max-width:340px;}
        .lp-root .lp-vis-desc{color:rgba(240,240,255,.55);}
        .lp-root.lp-light .lp-vis-desc{color:rgba(26,26,46,.55);}

        .lp-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px;}
        .lp-pill{padding:7px 14px;border-radius:99px;font-size:.78rem;font-weight:500;backdrop-filter:blur(10px);}
        .lp-root .lp-pill{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(240,240,255,.75);}
        .lp-root.lp-light .lp-pill{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);color:#4f46e5;}

        /* Form panel */
        .lp-form-panel{
          width:480px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          padding:40px 32px;
          position:relative;z-index:10;
        }
        .lp-root .lp-form-panel{background:rgba(12,12,28,.88);border-left:1px solid rgba(255,255,255,.06);}
        .lp-root.lp-light .lp-form-panel{background:rgba(255,255,255,.9);border-left:1px solid rgba(99,102,241,.12);}
        @media(max-width:900px){
          .lp-form-panel{width:100%;border-left:none;backdrop-filter:blur(20px);}
          .lp-root .lp-form-panel{background:rgba(12,12,28,.93);}
          .lp-root.lp-light .lp-form-panel{background:rgba(255,255,255,.93);}
        }

        .lp-inner{width:100%;max-width:380px;opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease;}
        .lp-inner.lp-visible{animation:lpFadeUp .6s ease forwards;opacity:1;transform:none;}

        /* Theme toggle */
        .lp-theme-btn{
          position:absolute;top:18px;right:18px;
          width:42px;height:42px;border-radius:50%;border:none;
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          transition:all .3s ease;z-index:20;
        }
        .lp-root .lp-theme-btn{background:rgba(255,255,255,.08);color:#fbbf24;}
        .lp-root .lp-theme-btn:hover{background:rgba(255,255,255,.14);transform:rotate(20deg) scale(1.08);}
        .lp-root.lp-light .lp-theme-btn{background:rgba(99,102,241,.1);color:#6366f1;}
        .lp-root.lp-light .lp-theme-btn:hover{background:rgba(99,102,241,.18);transform:rotate(-20deg) scale(1.08);}

        /* Brand */
        .lp-brand{display:flex;align-items:center;gap:12px;margin-bottom:32px;}
        .lp-brand-icon{
          width:42px;height:42px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          background:linear-gradient(135deg,#6366f1,#a855f7);
          box-shadow:0 8px 24px rgba(99,102,241,.45);flex-shrink:0;
        }
        .lp-brand-name{font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;letter-spacing:-.04em;}
        .lp-root .lp-brand-name{color:#f0f0ff;}
        .lp-root.lp-light .lp-brand-name{color:#1a1a2e;}

        .lp-title{font-family:'Syne',sans-serif;font-size:1.55rem;font-weight:800;letter-spacing:-.04em;margin-bottom:6px;}
        .lp-sub{font-size:.875rem;margin-bottom:26px;}
        .lp-root .lp-sub{color:rgba(240,240,255,.45);}
        .lp-root.lp-light .lp-sub{color:rgba(26,26,46,.5);}

        /* Google btn */
        .lp-google{
          width:100%;padding:11px 16px;
          display:flex;align-items:center;justify-content:center;gap:10px;
          border-radius:12px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:600;
          transition:all .2s ease;margin-bottom:20px;
        }
        .lp-root .lp-google{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(240,240,255,.9);}
        .lp-root .lp-google:hover:not(:disabled){background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.2);transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.35);}
        .lp-root.lp-light .lp-google{background:#fff;border:1px solid rgba(99,102,241,.2);color:#1a1a2e;box-shadow:0 2px 8px rgba(99,102,241,.08);}
        .lp-root.lp-light .lp-google:hover:not(:disabled){border-color:rgba(99,102,241,.4);transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.15);}
        .lp-google:disabled{opacity:.6;cursor:not-allowed;}

        /* Divider */
        .lp-divider{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
        .lp-divider-line{flex:1;height:1px;}
        .lp-root .lp-divider-line{background:rgba(255,255,255,.08);}
        .lp-root.lp-light .lp-divider-line{background:rgba(99,102,241,.15);}
        .lp-divider-txt{font-size:.73rem;font-weight:600;}
        .lp-root .lp-divider-txt{color:rgba(240,240,255,.28);}
        .lp-root.lp-light .lp-divider-txt{color:rgba(26,26,46,.35);}

        /* Fields */
        .lp-field{margin-bottom:14px;}
        .lp-label{display:block;font-size:.78rem;font-weight:600;margin-bottom:6px;letter-spacing:.02em;}
        .lp-root .lp-label{color:rgba(240,240,255,.65);}
        .lp-root.lp-light .lp-label{color:rgba(26,26,46,.65);}
        .lp-field-wrap{position:relative;}
        .lp-ficon{position:absolute;left:13px;top:50%;transform:translateY(-50%);pointer-events:none;}
        .lp-root .lp-ficon{color:rgba(240,240,255,.28);}
        .lp-root.lp-light .lp-ficon{color:rgba(99,102,241,.5);}

        .lp-input{
          width:100%;padding:11px 14px 11px 38px;
          border-radius:10px;
          font-family:'DM Sans',sans-serif;font-size:.9rem;
          outline:none;transition:all .2s ease;
        }
        .lp-root .lp-input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#f0f0ff;}
        .lp-root .lp-input::placeholder{color:rgba(240,240,255,.22);}
        .lp-root .lp-input:focus{background:rgba(99,102,241,.09);border-color:rgba(99,102,241,.5);box-shadow:0 0 0 3px rgba(99,102,241,.12);}
        .lp-root.lp-light .lp-input{background:#fff;border:1px solid rgba(99,102,241,.2);color:#1a1a2e;box-shadow:0 1px 4px rgba(99,102,241,.06);}
        .lp-root.lp-light .lp-input::placeholder{color:rgba(26,26,46,.28);}
        .lp-root.lp-light .lp-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);}
        .lp-input.lp-err{border-color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,.1)!important;}
        .lp-pw-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;display:flex;align-items:center;transition:opacity .2s;}
        .lp-root .lp-pw-btn{color:rgba(240,240,255,.3);}
        .lp-root .lp-pw-btn:hover{color:rgba(240,240,255,.7);}
        .lp-root.lp-light .lp-pw-btn{color:rgba(99,102,241,.45);}
        .lp-root.lp-light .lp-pw-btn:hover{color:#6366f1;}
        .lp-ferr{font-size:.74rem;color:#ef4444;margin-top:4px;display:block;}

        /* Submit */
        .lp-submit{
          width:100%;padding:12px;border-radius:12px;border:none;
          font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:700;
          cursor:pointer;
          background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;
          margin-top:8px;transition:all .25s ease;
          box-shadow:0 4px 20px rgba(99,102,241,.42);
          position:relative;overflow:hidden;
          letter-spacing:.02em;
        }
        .lp-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 30px rgba(99,102,241,.55);}
        .lp-submit:active:not(:disabled){transform:translateY(0);}
        .lp-submit:disabled{opacity:.6;cursor:not-allowed;}
        .lp-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.14),transparent);pointer-events:none;}

        .lp-ldots{display:inline-flex;align-items:center;gap:5px;}
        .lp-ldots span{width:5px;height:5px;border-radius:50%;background:#fff;animation:ldots 1.2s infinite both;}
        .lp-ldots span:nth-child(2){animation-delay:.2s;}
        .lp-ldots span:nth-child(3){animation-delay:.4s;}

        .lp-switch{text-align:center;font-size:.84rem;margin-top:20px;}
        .lp-root .lp-switch{color:rgba(240,240,255,.42);}
        .lp-root.lp-light .lp-switch{color:rgba(26,26,46,.48);}
        .lp-switch-btn{
          background:none;border:none;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:.84rem;font-weight:700;
          background:linear-gradient(135deg,#6366f1,#a855f7);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .lp-switch-btn:hover{opacity:.8;}
        .lp-mode-anim{animation:modeSlide .3s ease forwards;}
      `}</style>

      {/* WebGL background */}
      <div style={{position:'absolute',inset:0,zIndex:0}}>
        <FloatingOrbs theme={theme} />
        <Particles theme={theme} />
      </div>

      {/* LEFT visual panel */}
      <div className="lp-visual">
        <div className="lp-vis-inner">
          <div className="lp-tag">
            <span style={{width:6,height:6,borderRadius:'50%',background:'#10b981',display:'inline-block'}} />
            Project Management
          </div>
          <h2 className="lp-vis-title">
            Ship projects<br /><span className="lp-accent">faster together.</span>
          </h2>
          <p className="lp-vis-desc">
            Projex gives your team a single source of truth — organize tasks, track progress, and hit every deadline with confidence.
          </p>
          {/* <div className="lp-pills">
            {['Kanban Boards','Task Tracking','Team Collaboration','Due Date Alerts','Dashboard Analytics'].map(f => (
              <span key={f} className="lp-pill">✦ {f}</span>
            ))}
          </div> */}
        </div>
      </div>

      {/* RIGHT form panel */}
      <div className="lp-form-panel">
        <button className="lp-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>

        <div className={`lp-inner${mounted ? ' lp-visible' : ''}`}>
          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <span className="lp-brand-name">Projex</span>
          </div>

          <h1 className="lp-title">{mode === 'login' ? 'Welcome back' : 'Get started'}</h1>
          <p className="lp-sub">
            {mode === 'login' ? 'Sign in to continue to your projects' : 'Create your free account today'}
          </p>

          <button className="lp-google" onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37.5 9C34 5.8 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9L37.5 9C34 5.8 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.2L6.2 33C9.5 39.5 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.9 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          <div className="lp-divider">
            <div className="lp-divider-line"/><span className="lp-divider-txt">or continue with email</span><div className="lp-divider-line"/>
          </div>

          <div key={mode} className="lp-mode-anim">
            {mode === 'register' && (
              <div className="lp-field">
                <label className="lp-label">Full Name</label>
                <div className="lp-field-wrap">
                  <User size={15} className="lp-ficon" />
                  <input className={`lp-input${errors.name?' lp-err':''}`} placeholder="John Doe"
                    value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                </div>
                {errors.name && <span className="lp-ferr">{errors.name}</span>}
              </div>
            )}
            <div className="lp-field">
              <label className="lp-label">Email address</label>
              <div className="lp-field-wrap">
                <Mail size={15} className="lp-ficon" />
                <input className={`lp-input${errors.email?' lp-err':''}`} type="email" placeholder="you@example.com"
                  value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
              </div>
              {errors.email && <span className="lp-ferr">{errors.email}</span>}
            </div>
            <div className="lp-field">
              <label className="lp-label">Password</label>
              <div className="lp-field-wrap">
                <Lock size={15} className="lp-ficon" />
                <input className={`lp-input${errors.password?' lp-err':''}`}
                  type={showPass?'text':'password'}
                  placeholder={mode==='register'?'At least 6 characters':'••••••••'}
                  value={form.password} style={{paddingRight:40}}
                  onChange={e=>setForm({...form,password:e.target.value})}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
                <button className="lp-pw-btn" onClick={()=>setShowPass(s=>!s)}>
                  {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
              {errors.password && <span className="lp-ferr">{errors.password}</span>}
            </div>
          </div>

          <button className="lp-submit" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="lp-ldots"><span/><span/><span/></span>
              : mode==='login' ? 'Sign In →' : 'Create Account →'
            }
          </button>

          <p className="lp-switch">
            {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="lp-switch-btn" onClick={switchMode}>
              {mode==='login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
