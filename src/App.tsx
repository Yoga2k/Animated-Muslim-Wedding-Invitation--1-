import { useEffect, useRef, useState, useCallback } from "react";

/* ─── MUSIC ─── */
function useMusicPlayer() {
  const ctxRef  = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode; nodes: AudioNode[] } | null>(null);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    if (nodesRef.current) {
      try { nodesRef.current.gain.gain.setTargetAtTime(0, ctxRef.current!.currentTime, 0.5); } catch (_) {}
      setTimeout(() => { nodesRef.current?.nodes.forEach(n => { try { n.disconnect(); } catch (_) {} }); nodesRef.current = null; }, 800);
    }
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2);
    master.connect(ctx.destination);
    const nodes: AudioNode[] = [];
    const delay = ctx.createDelay(3); delay.delayTime.value = 0.55;
    const dg = ctx.createGain(); dg.gain.value = 0.28;
    delay.connect(dg); dg.connect(delay); dg.connect(master);
    nodes.push(delay, dg);
    const scale = [261.63,293.66,311.13,349.23,392.00,440.00,466.16,523.25];
    const melody = [0,2,4,5,4,2,0,1,3,5,7,5,3,2,0,4,2,0];
    const durs   = [0.8,0.4,0.6,0.4,0.8,0.4,1.0,0.5,0.5,0.6,0.8,0.6,0.5,0.4,1.2,0.6,0.4,1.6];
    [261.63,392.00,523.25].forEach((f,i) => {
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.frequency.value=f; g.gain.value=i===0?.06:.03;
      o.connect(g); g.connect(master); o.start(); nodes.push(o,g);
    });
    let loopStart = ctx.currentTime;
    const playMelody=(t0:number)=>{
      let t=t0;
      melody.forEach((ni,i)=>{
        const f=scale[ni], d=durs[i]*.55;
        (["sawtooth","sine"] as OscillatorType[]).forEach((type,ti)=>{
          const o=ctx.createOscillator(), e=ctx.createGain();
          o.type=type; o.frequency.value=f*(ti===1?2:1);
          e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(ti===0?.18:.09,t+.01);
          e.gain.exponentialRampToValueAtTime(.001,t+d);
          o.connect(e); e.connect(delay); e.connect(master); o.start(t); o.stop(t+d+.05); nodes.push(o,e);
        });
        t+=durs[i]*.55;
      });
      return t;
    };
    const playDrum=(t0:number)=>{
      [0,.55,1.1,1.65,2.2,2.75,3.3].forEach(off=>{
        const buf=ctx.createBuffer(1,ctx.sampleRate*.15,ctx.sampleRate);
        const d=buf.getChannelData(0);
        for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.04));
        const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
        f.type="bandpass"; f.frequency.value=180; f.Q.value=.8; g.gain.value=.12;
        s.buffer=buf; s.connect(f); f.connect(g); g.connect(master); s.start(t0+off); nodes.push(s,f,g);
      });
    };
    const loopMelody=()=>{ const e=playMelody(loopStart); playDrum(loopStart); loopStart=e; };
    loopMelody();
    const loopId=setInterval(()=>{ if(nodesRef.current) loopMelody(); else clearInterval(loopId); }, (durs.reduce((a,v)=>a+v,0)*.55*1000)-200);
    nodes.push({ disconnect:()=>clearInterval(loopId) } as unknown as AudioNode);
    nodesRef.current={ gain:master, nodes };
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => { if(playing) stop(); else play(); }, [playing,play,stop]);
  useEffect(()=>()=>stop(),[stop]);
  return { playing, toggle };
}

/* ─── SCROLL ENGINE ─── */
function useScrollEngine() {
  useEffect(() => {
    const bar = document.getElementById("scroll-bar");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = `${(window.scrollY / max) * 100}%`;
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach(el => {
        const speed = parseFloat(el.dataset.parallax || "0.3");
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translateY(${center * speed}px)`;
      });
    };
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-reveal],[data-stagger]").forEach(el => io.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, []);
}

/* ─── PARTICLE BURST ─── */
function useParticleBurst() {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      for (let i = 0; i < 8; i++) {
        const p = document.createElement("div");
        p.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:6px;height:6px;border-radius:50%;background:${i%2?"#C9A84C":"#E8D08A"};pointer-events:none;z-index:9999;animation:particle-rise .9s ease ${i*.06}s forwards;transform:translate(-50%,-50%)`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1100);
      }
    };
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);
}

/* ─── 3D TILT CARD ─── */
function TiltCard({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 18}deg) rotateX(${-y * 14}deg) scale(1.03)`;
    if (shine.current) {
      shine.current.style.background = `radial-gradient(circle at ${(x+.5)*100}% ${(y+.5)*100}%, rgba(255,248,220,.13) 0%, transparent 65%)`;
    }
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)";
    if (shine.current) shine.current.style.background = "none";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`card-3d ${className}`}
      style={{ transformStyle:"preserve-3d", transition:"transform .12s ease", willChange:"transform", ...style }}>
      {children}
      <div ref={shine} className="card-shine" />
    </div>
  );
}

/* ─── LIQUID BLOBS ─── */
function LiquidBlobs({ count = 3, section = 0 }: { count?: number; section?: number }) {
  const configs = [
    { cls:"blob-a", w:340, h:340, top:"10%",  left:"5%",  bg:"rgba(13,74,58,0.35)",   blur:60 },
    { cls:"blob-b", w:280, h:280, top:"55%",  right:"8%", bg:"rgba(201,168,76,0.07)",  blur:50 },
    { cls:"blob-c", w:200, h:200, top:"30%",  left:"60%", bg:"rgba(26,107,82,0.22)",  blur:40 },
    { cls:"blob-a", w:260, h:260, bottom:"10%",left:"20%",bg:"rgba(201,168,76,0.05)", blur:45 },
  ];
  return (
    <>
      {configs.slice(0, count).map((c, i) => (
        <div key={`${section}-${i}`} className={`blob ${c.cls} absolute pointer-events-none`}
          style={{ width:c.w, height:c.h, top:c.top, left:(c as any).left, right:(c as any).right, bottom:(c as any).bottom,
            background:c.bg, filter:`blur(${c.blur}px)`, zIndex:0 }} />
      ))}
    </>
  );
}

/* ─── WAVE DIVIDER ─── */
function WaveDivider({ flip = false, topColor = "#050F0A", bottomColor = "#0D4A3A" }) {
  return (
    <div style={{ position:"relative", height:80, overflow:"hidden", background:topColor, transform: flip ? "scaleY(-1)" : "none" }}>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none"
        style={{ position:"absolute", bottom:0, width:"100%", height:"100%" }}>
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={bottomColor} />
            <stop offset="50%"  stopColor={bottomColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={bottomColor} />
          </linearGradient>
        </defs>
        {/* two layers for liquid depth */}
        <path fill="rgba(201,168,76,0.06)"
          style={{ animation:"wave-flow 4s ease-in-out infinite" }}
          d="M0,40 C200,0 400,80 600,40 C800,0 1000,80 1200,40 L1200,80 L0,80 Z" />
        <path fill={`url(#waveGrad)`}
          style={{ animation:"wave-flow 6s ease-in-out infinite reverse" }}
          d="M0,45 C150,10 350,75 600,45 C850,15 1050,75 1200,45 L1200,80 L0,80 Z" />
      </svg>
    </div>
  );
}

/* ─── LIQUID RING ─── */
function LiquidRing({ size = 200, color = "#C9A84C", opacity = 0.15, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} style={{ opacity }}>
      <g fill="none" stroke={color} strokeWidth="0.7">
        <circle cx="100" cy="100" r="90" />
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="30" />
        <polygon points="100,10 155,35 190,90 190,110 155,165 100,190 45,165 10,110 10,90 45,35" />
        <polygon points="100,30 125,70 168,70 135,100 148,145 100,118 52,145 65,100 32,70 75,70" />
        {[0,45,90,135,180,225,270,315].map((a,i)=>(
          <line key={i} x1="100" y1="100" x2={100+95*Math.cos(a*Math.PI/180)} y2={100+95*Math.sin(a*Math.PI/180)} strokeDasharray="4 4" />
        ))}
        {[0,45,90,135,180,225,270,315].map((a,i)=>(
          <circle key={i} cx={100+65*Math.cos(a*Math.PI/180)} cy={100+65*Math.sin(a*Math.PI/180)} r="5" fill={color} opacity="0.5" />
        ))}
      </g>
    </svg>
  );
}

function Star({ size = 12, color = "#C9A84C" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20"><polygon points="10,1 12,8 19,8 13,12 15,19 10,15 5,19 7,12 1,8 8,8" fill={color} /></svg>;
}

function OrnamentDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-8" data-reveal="scale">
      <svg width="100" height="12" viewBox="0 0 100 12">
        <line x1="0" y1="6" x2="82" y2="6" stroke="#C9A84C" strokeWidth="0.7" opacity="0.5" />
        <circle cx="88" cy="6" r="4" fill="none" stroke="#C9A84C" strokeWidth="0.8" /><circle cx="88" cy="6" r="1.5" fill="#C9A84C" />
      </svg>
      <Star size={18} />
      <svg width="100" height="12" viewBox="0 0 100 12">
        <circle cx="12" cy="6" r="4" fill="none" stroke="#C9A84C" strokeWidth="0.8" /><circle cx="12" cy="6" r="1.5" fill="#C9A84C" />
        <line x1="18" y1="6" x2="100" y2="6" stroke="#C9A84C" strokeWidth="0.7" opacity="0.5" />
      </svg>
    </div>
  );
}

function Lanterns() {
  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ height:120 }}>
      {[4,12,22,35,50,65,78,88,96].map((x,i)=>(
        <div key={i} className="absolute top-0" style={{ left:`${x}%`, animation:`lantern-sway ${2.5+i*.3}s ease-in-out infinite`, animationDelay:`${i*.25}s`, transformOrigin:"top center" }}>
          <div style={{ width:1, height:50, background:"rgba(201,168,76,0.4)", margin:"0 auto" }} />
          <svg width="28" height="44" viewBox="0 0 28 44">
            <ellipse cx="14" cy="7" rx="7" ry="3.5" fill="#C9A84C" />
            <path d="M7,7 Q4,22 7,37 Q14,44 21,37 Q24,22 21,7 Z" fill="#E8A020" opacity="0.9" />
            <ellipse cx="14" cy="37" rx="7" ry="3.5" fill="#C9A84C" />
            <line x1="14" y1="37" x2="14" y2="44" stroke="#C9A84C" strokeWidth="1.5" />
            {[12,21,30].map(y=><ellipse key={y} cx="14" cy={y} rx="5.5" ry="1" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.6"/>)}
          </svg>
        </div>
      ))}
    </div>
  );
}

function TwinklingStars() {
  const stars = Array.from({length:50},(_,i)=>({
    x: (i*17.3)%100, y: (i*13.7)%100, s: 3+((i*7)%5), delay: i*.12, dur: 1.5+(i%3)*.8, gold: i%3===0
  }));
  return (
    <>
      {stars.map((s,i)=>(
        <div key={i} className="absolute pointer-events-none twinkle"
          style={{ left:`${s.x}%`, top:`${s.y}%`, animationDelay:`${s.delay}s`, animationDuration:`${s.dur}s` }}>
          <Star size={s.s} color={s.gold?"#E8D08A":"#C9A84C"} />
        </div>
      ))}
    </>
  );
}

function FloatingPetals() {
  const items = ["🌸","🌺","✨","🌿","🌷","⭐","🌙"];
  return (
    <>
      {Array.from({length:14}).map((_,i)=>(
        <span key={i} className="petal" style={{
          left:`${(i*7.3)%100}%`, fontSize:`${.7+(i%3)*.3}rem`,
          animationDuration:`${9+(i%5)*2}s`, animationDelay:`${i*.8}s`,
        }}>{items[i%items.length]}</span>
      ))}
    </>
  );
}

function Countdown() {
  const target = new Date("2025-03-15T18:00:00").getTime();
  const calc = () => {
    const d = Math.max(0, target - Date.now());
    return { days:Math.floor(d/864e5), hours:Math.floor(d%864e5/36e5), minutes:Math.floor(d%36e5/6e4), seconds:Math.floor(d%6e4/1e3) };
  };
  const [t, setT] = useState(calc);
  useEffect(()=>{ const id=setInterval(()=>setT(calc()),1000); return()=>clearInterval(id); },[]);
  return (
    <div className="flex gap-4 justify-center flex-wrap" data-stagger>
      {[["Days",t.days],["Hours",t.hours],["Minutes",t.minutes],["Seconds",t.seconds]].map(([l,v])=>(
        <TiltCard key={l as string}>
          <div className="text-center rounded-2xl px-6 py-5 relative overflow-hidden pulse-gold"
            style={{ background:"rgba(201,168,76,0.07)", border:"1px solid rgba(201,168,76,0.35)", minWidth:90 }}>
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ animation:"ripple 2s ease infinite", border:"1px solid rgba(201,168,76,0.2)" }} />
            <div key={`${l}-${v}`} className="font-['Cinzel_Decorative'] text-4xl font-bold gold-shimmer card-inner-depth" style={{ animation:"number-tick .3s ease" }}>
              {String(v as number).padStart(2,"0")}
            </div>
            <div className="text-xs mt-1 tracking-widest uppercase" style={{ color:"var(--gold)", fontFamily:"Cormorant,serif", fontStyle:"italic" }}>{l}</div>
          </div>
        </TiltCard>
      ))}
    </div>
  );
}

function RsvpForm() {
  const [status, setStatus] = useState<"idle"|"sent">("idle");
  const [attending, setAttending] = useState("yes");
  const submit = (e: React.FormEvent) => { e.preventDefault(); setStatus("sent"); };
  if (status==="sent") return (
    <div className="text-center p-12 rounded-2xl float" style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.3)" }}>
      <div className="text-6xl mb-4">✨</div>
      <h3 className="font-['Cinzel_Decorative'] text-3xl gold-shimmer mb-2">JazakAllah Khayran</h3>
      <p className="text-2xl mb-4" style={{ fontFamily:"Amiri,serif", color:"var(--gold-light)" }}>جَزَاكَ اللَّهُ خَيْرًا</p>
      <p className="italic text-lg" style={{ color:"var(--cream)", opacity:.85 }}>Your response has been received. We look forward to celebrating with you!</p>
    </div>
  );
  const inp: React.CSSProperties = { background:"rgba(201,168,76,0.07)", border:"1px solid rgba(201,168,76,0.3)", color:"var(--cream)", fontFamily:"Cormorant,serif", borderRadius:10, width:"100%", padding:"12px 16px", outline:"none", fontSize:"1rem", transition:"border-color .3s" };
  return (
    <form onSubmit={submit} className="rounded-2xl p-8 space-y-5" data-reveal="up"
      style={{ background:"rgba(201,168,76,0.04)", border:"1px solid rgba(201,168,76,0.18)" }}>
      {[["Full Name","text","Your name..."],["Email","email","your@email.com"]].map(([l,t,p])=>(
        <div key={l}><label className="block text-xs tracking-widest uppercase mb-2" style={{ color:"var(--gold)", opacity:.8 }}>{l}</label>
        <input type={t} required placeholder={p} style={inp} onFocus={e=>(e.target.style.borderColor="rgba(201,168,76,.7)")} onBlur={e=>(e.target.style.borderColor="rgba(201,168,76,.3)")} /></div>
      ))}
      <div><label className="block text-xs tracking-widest uppercase mb-2" style={{ color:"var(--gold)", opacity:.8 }}>Guests</label>
        <select style={{ ...inp }} defaultValue="1">{[1,2,3,4,5].map(n=><option key={n} value={n} style={{ background:"#0A2E22" }}>{n} guest{n>1?"s":""}</option>)}</select></div>
      <div><label className="block text-xs tracking-widest uppercase mb-3" style={{ color:"var(--gold)", opacity:.8 }}>Attendance</label>
        <div className="flex gap-3">
          {["yes","no"].map(v=>(
            <button type="button" key={v} onClick={()=>setAttending(v)} className="flex-1 py-3 rounded-xl text-sm tracking-wider uppercase"
              style={{ background:attending===v?"rgba(201,168,76,0.22)":"rgba(201,168,76,0.05)", border:`1px solid ${attending===v?"rgba(201,168,76,.7)":"rgba(201,168,76,.2)"}`, color:attending===v?"var(--gold-light)":"var(--cream)", transition:"all .3s" }}>
              {v==="yes"?"✓ Joyfully Accept":"✗ Regretfully Decline"}
            </button>
          ))}
        </div>
      </div>
      <div><label className="block text-xs tracking-widest uppercase mb-2" style={{ color:"var(--gold)", opacity:.8 }}>Du'a / Message</label>
        <textarea rows={3} placeholder="Share a blessing for the couple..." style={{ ...inp, resize:"none" }} onFocus={e=>(e.target.style.borderColor="rgba(201,168,76,.7)")} onBlur={e=>(e.target.style.borderColor="rgba(201,168,76,.3)")} /></div>
      <button type="submit" className="w-full py-4 rounded-xl text-sm tracking-[.3em] uppercase font-bold"
        style={{ background:"linear-gradient(135deg,var(--gold-dark),var(--gold),var(--gold-light))", color:"#051A12", transition:"transform .3s" }}
        onMouseOver={e=>(e.currentTarget.style.transform="scale(1.03)")} onMouseOut={e=>(e.currentTarget.style.transform="scale(1)")}>
        Send RSVP ✦
      </button>
    </form>
  );
}

function MusicButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <>
      {!playing && (
        <div className="fixed bottom-20 right-5 z-50 pointer-events-none" style={{ animation:"slide-up .6s .8s both" }}>
          <div className="rounded-xl px-3 py-2 text-xs whitespace-nowrap" style={{ background:"rgba(13,74,58,0.95)", border:"1px solid rgba(201,168,76,0.4)", color:"var(--gold-light)" }}>🎵 Tap to play ambient music</div>
          <div className="ml-auto mr-4 w-0 h-0" style={{ borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:"6px solid rgba(13,74,58,0.95)" }} />
        </div>
      )}
      <button onClick={onToggle} className="fixed bottom-7 right-7 z-50 flex items-center justify-center rounded-full"
        style={{ width:58, height:58, background:"linear-gradient(135deg,#0D4A3A,#1A6B52)", border:"1.5px solid rgba(201,168,76,0.6)", animation:playing?"pulse-glow 2.5s ease-in-out infinite":"none", cursor:"pointer", transition:"transform .2s" }}
        onMouseOver={e=>(e.currentTarget.style.transform="scale(1.12)")} onMouseOut={e=>(e.currentTarget.style.transform="scale(1)")}>
        {playing
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#C9A84C"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#C9A84C"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 5l12 7-12 7V5z" fill="#C9A84C"/></svg>}
        {playing && <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border:"1px solid rgba(201,168,76,0.3)", animation:"ripple 2s ease infinite" }} />}
      </button>
      {playing && (
        <div className="fixed bottom-7 right-20 z-50 flex items-end gap-[3px] pointer-events-none" style={{ height:28 }}>
          {[1,2,3,4,5].map(i=><div key={i} className="rounded-sm" style={{ width:4, background:"var(--gold)", opacity:.7, animation:`float ${.4+i*.12}s ease-in-out infinite alternate`, height:`${40+i*12}%` }} />)}
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════ */
export default function App() {
  useScrollEngine();
  useParticleBurst();
  const { playing, toggle } = useMusicPlayer();

  return (
    <div className="min-h-full" style={{ background:"var(--deep)", color:"var(--cream)", fontFamily:"Cormorant,serif" }}>
      <div id="scroll-bar" />
      <MusicButton playing={playing} onToggle={toggle} />
      <FloatingPetals />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background:"linear-gradient(160deg,#050F0A 0%,#0D4A3A 45%,#050F0A 100%)" }}>
        {/* liquid blobs */}
        <LiquidBlobs count={4} section={0} />
        {/* geo parallax */}
        <div className="absolute inset-0 pointer-events-none">
          <div data-parallax="0.25" className="absolute -top-40 -left-40" style={{ willChange:"transform" }}>
            <LiquidRing size={550} className="geo-spin" opacity={.07} />
          </div>
          <div data-parallax="-0.2" className="absolute -bottom-20 -right-20" style={{ willChange:"transform" }}>
            <LiquidRing size={420} className="geo-rev" opacity={.06} />
          </div>
          <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full" style={{ background:"radial-gradient(circle,rgba(201,168,76,.12) 0%,transparent 70%)" }} />
        </div>
        <Lanterns />
        <TwinklingStars />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" style={{ animation:"slide-up .9s .3s both" }}>
          <div className="mb-6 float" data-reveal="down">
            <p className="text-4xl mb-2" style={{ color:"var(--gold)", fontFamily:"Amiri,serif", lineHeight:1.8 }}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <p className="text-xs tracking-[.4em] uppercase" style={{ color:"var(--gold-light)", opacity:.65 }}>In the Name of Allah, the Most Gracious, the Most Merciful</p>
          </div>
          <OrnamentDivider />
          <TiltCard className="mb-8 rounded-2xl" style={{ background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.2)" }}>
            <div className="px-6 py-5 card-inner-depth">
              <p className="text-2xl mb-2" style={{ fontFamily:"Amiri,serif", color:"var(--gold-light)", lineHeight:2 }}>
                وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا
              </p>
              <p className="text-sm italic" style={{ color:"var(--gold)", opacity:.85 }}>"And of His signs is that He created for you from yourselves mates that you may find tranquility in them"</p>
              <p className="text-xs tracking-widest mt-1" style={{ color:"var(--gold)", opacity:.55 }}>— Surah Ar-Rum 30:21</p>
            </div>
          </TiltCard>
          <p className="text-xs tracking-[.4em] uppercase mb-5" style={{ color:"var(--gold)", opacity:.7 }}>With Allah's Blessings · We Joyfully Invite You</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-4" data-stagger>
            <div>
              <h1 className="font-['Cinzel_Decorative'] text-6xl md:text-8xl font-bold gold-shimmer leading-none">Zainab</h1>
              <p className="mt-2 text-2xl" style={{ fontFamily:"Amiri,serif", color:"var(--gold-light)" }}>زينب</p>
            </div>
            <div className="text-center"><div className="text-5xl float-x" style={{ color:"var(--gold)" }}>✦</div></div>
            <div>
              <h1 className="font-['Cinzel_Decorative'] text-6xl md:text-8xl font-bold gold-shimmer leading-none">Ibrahim</h1>
              <p className="mt-2 text-2xl" style={{ fontFamily:"Amiri,serif", color:"var(--gold-light)" }}>إبراهيم</p>
            </div>
          </div>
          <OrnamentDivider />
          <div className="flex flex-wrap justify-center gap-8 text-center mt-4" data-stagger>
            {[["Date","15 March 2025"],["Time","2:00 PM"],["Venue","Al-Noor Palace"],["City","Istanbul, Turkey"]].map(([l,v])=>(
              <div key={l}><p className="text-xs tracking-widest uppercase" style={{ color:"var(--gold)", opacity:.6 }}>{l}</p>
              <p className="font-['Cinzel_Decorative'] text-xl" style={{ color:"var(--gold-light)" }}>{v}</p></div>
            ))}
          </div>
          <div className="mt-16 flex flex-col items-center gap-2 float">
            <p className="text-xs tracking-widest uppercase" style={{ color:"var(--gold)", opacity:.4 }}>Scroll to discover</p>
            <div style={{ width:1, height:50, background:"linear-gradient(to bottom,rgba(201,168,76,.6),transparent)" }} />
            <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--gold)", animation:"ripple 1.5s ease infinite" }} />
          </div>
        </div>
      </section>

      <WaveDivider topColor="#050F0A" bottomColor="#0D4A3A" />

      {/* ── COUNTDOWN ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background:"#0D4A3A" }}>
        <LiquidBlobs count={3} section={1} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div data-reveal="scale"><LiquidRing size={90} className="mx-auto mb-6 geo-spin" opacity={.45} /></div>
          <h2 className="font-['Cinzel_Decorative'] text-4xl gold-shimmer mb-2" data-reveal="up">The Blessed Day Approaches</h2>
          <p className="mb-10 italic text-lg" data-reveal="up" style={{ color:"var(--gold)", opacity:.7 }}>Counting every heartbeat until we celebrate</p>
          <Countdown />
        </div>
      </section>

      <WaveDivider topColor="#0D4A3A" bottomColor="#050F0A" />

      {/* ── COUPLE ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background:"#050F0A" }}>
        <LiquidBlobs count={3} section={2} />
        <div data-parallax="-0.05" className="absolute -right-16 top-10 pointer-events-none" style={{ willChange:"transform" }}>
          <LiquidRing size={350} className="geo-rev" opacity={.05} />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[.4em] uppercase mb-3" data-reveal="down" style={{ color:"var(--gold)", opacity:.7 }}>Our Families</p>
            <h2 className="font-['Cinzel_Decorative'] text-5xl gold-shimmer" data-reveal="up">The Beloved Couple</h2>
            <OrnamentDivider />
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            {[
              { img:"https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=300&h=300&fit=crop&auto=format", name:"Zainab", arabic:"زينب بنت أحمد الرشيد", parents:"Daughter of Ahmad & Fatima Al-Rashid", quote:"She is light, she is grace — a soul adorned with faith and gentleness.", dir:"left" as const },
              { img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format", name:"Ibrahim", arabic:"إبراهيم بن يوسف الأنصاري", parents:"Son of Yusuf & Khadijah Al-Ansari", quote:"He is steadfast, kind, devoted — a man of honor walking the path of the righteous.", dir:"right" as const },
            ].map(p=>(
              <div key={p.name} data-reveal={p.dir}>
                <TiltCard className="text-center rounded-2xl p-8 relative overflow-hidden"
                  style={{ background:"linear-gradient(135deg,rgba(201,168,76,.07),rgba(13,74,58,.25))", border:"1px solid rgba(201,168,76,.2)" }}>
                  <div className="absolute top-3 right-3 opacity-10 pointer-events-none"><LiquidRing size={120} opacity={1} /></div>
                  {/* floating photo — lifted via translateZ */}
                  <div className="card-inner-depth">
                    <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden pulse-gold" style={{ border:"2px solid rgba(201,168,76,.5)" }}>
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-['Cinzel_Decorative'] text-3xl gold-shimmer mb-1">{p.name}</h3>
                    <p className="text-xl mb-1" style={{ fontFamily:"Amiri,serif", color:"var(--gold-light)" }}>{p.arabic}</p>
                    <p className="text-sm tracking-wider mb-4" style={{ color:"var(--gold)", opacity:.65 }}>{p.parents}</p>
                    <p className="text-base italic leading-relaxed" style={{ color:"var(--cream)", opacity:.8 }}>"{p.quote}"</p>
                  </div>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider topColor="#050F0A" bottomColor="#0D4A3A" />

      {/* ── EVENTS TIMELINE ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background:"#0D4A3A" }}>
        <LiquidBlobs count={3} section={3} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[.4em] uppercase mb-3" data-reveal="down" style={{ color:"var(--gold)", opacity:.7 }}>Schedule of Celebrations</p>
            <h2 className="font-['Cinzel_Decorative'] text-5xl gold-shimmer" data-reveal="up">Events & Timeline</h2>
            <OrnamentDivider />
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
              style={{ background:"linear-gradient(to bottom,transparent,rgba(201,168,76,.5) 20%,rgba(201,168,76,.5) 80%,transparent)" }} />
            {[
              { time:"Fri 14 Mar · 8:00 PM", icon:"🌿", title:"Mehndi Night", arabic:"حفلة الحنة", desc:"A vibrant evening of henna artistry, music, and women's celebrations. Intricate patterns adorning the bride's hands, symbolizing joy, love and blessings.", venue:"Al-Noor Palace — Rose Garden Hall", side:"left" },
              { time:"Sat 15 Mar · 2:00 PM", icon:"🕌", title:"Nikah Ceremony", arabic:"حفل النكاح", desc:"The sacred Islamic marriage contract, witnessed by family and officiated by Sheikh Abdullah Al-Karim. The Mahr is presented as Ibrahim's gift of love to Zainab.", venue:"Sultan Ahmed Mosque, Istanbul", side:"right" },
              { time:"Sat 15 Mar · 6:00 PM", icon:"🌟", title:"Walima Reception", arabic:"حفل الوليمة", desc:"The prophetic tradition — a grand wedding feast for family and community. An evening of du'a, feasting, and celebrating the union blessed by Allah.", venue:"Al-Noor Palace — Grand Ballroom", side:"left" },
              { time:"Sun 16 Mar · 11:00 AM", icon:"☀️", title:"Family Brunch", arabic:"غداء العائلة", desc:"An intimate morning gathering with close family — traditional Turkish breakfast, warm conversations, and heartfelt farewells along the Bosphorus.", venue:"Bosphorus Terrace, Al-Noor Palace", side:"right" },
            ].map((ev,i)=>(
              <div key={i} className={`flex md:items-center mb-14 gap-8 flex-col ${ev.side==="right"?"md:flex-row-reverse":"md:flex-row"}`}>
                <div className={`md:w-1/2 ${ev.side==="right"?"md:text-left":"md:text-right"}`}>
                  <div data-reveal={ev.side}>
                    <TiltCard className="rounded-2xl p-6" style={{ background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.18)" }}>
                      <div className="card-inner-depth">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <span className="text-3xl">{ev.icon}</span>
                          <div><h3 className="font-['Cinzel_Decorative'] text-xl" style={{ color:"var(--gold-light)" }}>{ev.title}</h3>
                          <p style={{ fontFamily:"Amiri,serif", color:"var(--gold)", opacity:.8 }}>{ev.arabic}</p></div>
                        </div>
                        <p className="text-sm mb-2" style={{ color:"var(--gold)", opacity:.65 }}>⏰ {ev.time}</p>
                        <p className="text-sm leading-relaxed mb-3" style={{ color:"var(--cream)", opacity:.85 }}>{ev.desc}</p>
                        <p className="text-xs italic" style={{ color:"var(--gold-light)", opacity:.7 }}>📍 {ev.venue}</p>
                      </div>
                    </TiltCard>
                  </div>
                </div>
                <div className="hidden md:flex w-12 h-12 rounded-full items-center justify-center flex-shrink-0 z-10 pulse-gold"
                  style={{ background:"#0D4A3A", border:"2px solid var(--gold)" }}>
                  <span className="text-lg">{ev.icon}</span>
                </div>
                <div className="md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider topColor="#0D4A3A" bottomColor="#050F0A" />

      {/* ── LOCATION ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background:"#050F0A" }}>
        <LiquidBlobs count={3} section={4} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[.4em] uppercase mb-3" data-reveal="down" style={{ color:"var(--gold)", opacity:.7 }}>Where to Find Us</p>
            <h2 className="font-['Cinzel_Decorative'] text-5xl gold-shimmer" data-reveal="up">Venue & Location</h2>
            <OrnamentDivider />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { img:"https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=700&h=350&fit=crop&auto=format", tag:"Nikah Ceremony", name:"Sultan Ahmed Mosque", arabic:"مسجد السلطان أحمد", address:"At Meydanı No:7, Fatih\nIstanbul 34122, Turkey", time:"Saturday, 15 March · 2:00 PM", dir:"left" },
              { img:"https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=700&h=350&fit=crop&auto=format", tag:"Mehndi & Walima", name:"Al-Noor Palace", arabic:"قصر النور", address:"Bosphorus Boulevard, Beşiktaş\nIstanbul 34353, Turkey", time:"Fri 14 Mar · 8 PM  &  Sat 15 Mar · 6 PM", dir:"right" },
            ].map(v=>(
              <div key={v.name} data-reveal={v.dir}>
                <TiltCard className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(201,168,76,.22)" }}>
                  <div className="relative h-52 overflow-hidden">
                    <img src={v.img} alt={v.name} className="w-full h-full object-cover" style={{ transition:"transform .6s ease" }}
                      onMouseOver={e=>(e.currentTarget.style.transform="scale(1.1)")} onMouseOut={e=>(e.currentTarget.style.transform="scale(1)")} />
                    <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(5,15,10,.9),transparent)" }} />
                    <span className="absolute bottom-3 left-4 text-xs tracking-widest uppercase px-2 py-1 rounded"
                      style={{ background:"rgba(201,168,76,.2)", color:"var(--gold)", border:"1px solid rgba(201,168,76,.4)" }}>{v.tag}</span>
                  </div>
                  <div className="p-6 card-inner-depth" style={{ background:"rgba(201,168,76,.04)" }}>
                    <h3 className="font-['Cinzel_Decorative'] text-2xl mb-1" style={{ color:"var(--gold-light)" }}>{v.name}</h3>
                    <p className="text-lg mb-3" style={{ fontFamily:"Amiri,serif", color:"var(--gold)", opacity:.8 }}>{v.arabic}</p>
                    <p className="text-sm leading-relaxed mb-2 whitespace-pre-line" style={{ color:"var(--cream)", opacity:.8 }}>{v.address}</p>
                    <p className="text-sm mb-4" style={{ color:"var(--gold)", opacity:.65 }}>📅 {v.time}</p>
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                      className="inline-block px-5 py-2 text-xs tracking-widest uppercase rounded-lg"
                      style={{ background:"rgba(201,168,76,.12)", color:"var(--gold)", border:"1px solid rgba(201,168,76,.4)", transition:"all .3s" }}
                      onMouseOver={e=>{ e.currentTarget.style.background="rgba(201,168,76,.25)"; }} onMouseOut={e=>{ e.currentTarget.style.background="rgba(201,168,76,.12)"; }}>
                      Get Directions →
                    </a>
                  </div>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider topColor="#050F0A" bottomColor="#0D4A3A" />

      {/* ── TRADITIONS ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background:"#0D4A3A" }}>
        <LiquidBlobs count={4} section={5} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[.4em] uppercase mb-3" data-reveal="down" style={{ color:"var(--gold)", opacity:.7 }}>Our Heritage</p>
            <h2 className="font-['Cinzel_Decorative'] text-5xl gold-shimmer" data-reveal="up">Islamic Traditions</h2>
            <OrnamentDivider />
          </div>
          <div className="grid md:grid-cols-3 gap-6" data-stagger>
            {[
              { icon:"📜", arabic:"النكاح", title:"Nikah", desc:"The sacred marriage contract signed before witnesses and a Wali. The Mahr is Ibrahim's gift to Zainab — hers alone, forever." },
              { icon:"🤲", arabic:"الدعاء", title:"Du'a & Blessings", desc:"Sheikh Abdullah Al-Karim recites the Khutbat-un-Nikah, invoking Allah's blessings upon the union and all present." },
              { icon:"🌿", arabic:"حفلة الحنة", title:"Henna Night", desc:"Centuries-old tradition adorning the bride's hands with intricate patterns — flowers, paisley, and sacred geometry." },
              { icon:"🍽️", arabic:"الوليمة", title:"Walima Feast", desc:"The prophetic feast shared with community — an act of worship announcing the union and sharing joy with others." },
              { icon:"👗", arabic:"اللباس", title:"Dress Code", desc:"Modesty and elegance in the spirit of Islam. Colors: emerald, ivory, gold. Head covering for ladies is appreciated." },
              { icon:"🎁", arabic:"المهر والهدايا", title:"Mahr & Gifts", desc:"The Mahr is set at 24-karat gold. Your presence, du'a, and sincere blessings are the most cherished gifts of all." },
            ].map(t=>(
              <TiltCard key={t.title} className="rounded-xl p-6" style={{ background:"rgba(201,168,76,.05)", border:"1px solid rgba(201,168,76,.15)" }}>
                <div className="card-inner-depth">
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <p className="text-lg mb-1" style={{ fontFamily:"Amiri,serif", color:"var(--gold)" }}>{t.arabic}</p>
                  <h3 className="font-['Cinzel_Decorative'] text-lg mb-3" style={{ color:"var(--gold-light)" }}>{t.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:"var(--cream)", opacity:.8 }}>{t.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider topColor="#0D4A3A" bottomColor="#050F0A" />

      {/* ── DRESS CODE ── */}
      <section className="py-20 px-6 relative overflow-hidden" style={{ background:"#050F0A" }}>
        <LiquidBlobs count={2} section={6} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-['Cinzel_Decorative'] text-4xl gold-shimmer mb-2" data-reveal="up">Dress Code</h2>
          <OrnamentDivider />
          <p className="mb-10 italic text-lg" data-reveal="up" style={{ color:"var(--cream)", opacity:.8 }}>Dress modestly and elegantly in the spirit of Islamic values</p>
          <div className="flex justify-center gap-10" data-stagger>
            {[{ color:"#0D4A3A", label:"Emerald" },{ color:"#C9A84C", label:"Gold" },{ color:"#FAF3E0", label:"Ivory" }].map(({ color, label })=>(
              <TiltCard key={label} className="text-center rounded-full" style={{ background:"transparent" }}>
                <div className="w-20 h-20 rounded-full mx-auto mb-3 pulse-gold" style={{ background:color, border:"2px solid rgba(201,168,76,.5)" }} />
                <p className="text-sm tracking-widest uppercase" style={{ color:"var(--gold)", opacity:.8 }}>{label}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider topColor="#050F0A" bottomColor="#030A07" />

      {/* ── RSVP ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background:"#030A07" }}>
        <LiquidBlobs count={3} section={7} />
        <div data-parallax="0.12" className="absolute -right-20 -bottom-20 pointer-events-none" style={{ willChange:"transform" }}>
          <LiquidRing size={380} className="geo-rev" opacity={.06} />
        </div>
        <div className="max-w-xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[.4em] uppercase mb-3" data-reveal="down" style={{ color:"var(--gold)", opacity:.7 }}>Kindly Respond By 1 March 2025</p>
            <h2 className="font-['Cinzel_Decorative'] text-5xl gold-shimmer" data-reveal="up">RSVP</h2>
            <OrnamentDivider />
            <p className="italic text-lg" data-reveal="up" style={{ color:"var(--cream)", opacity:.8 }}>Your presence graces our celebration</p>
          </div>
          <RsvpForm />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-6 text-center relative overflow-hidden" style={{ background:"#020705", borderTop:"1px solid rgba(201,168,76,.12)" }}>
        <LiquidBlobs count={2} section={8} />
        <div className="relative z-10">
          <div data-reveal="scale"><LiquidRing size={130} className="mx-auto mb-8 geo-spin" opacity={.35} /></div>
          <p className="text-3xl mb-2" data-reveal="up" style={{ fontFamily:"Amiri,serif", color:"var(--gold)", lineHeight:2 }}>
            بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
          </p>
          <p className="italic text-sm mb-8" data-reveal="up" style={{ color:"var(--gold-light)", opacity:.65 }}>"May Allah bless you both, and may He join you together in goodness."</p>
          <OrnamentDivider />
          <p className="font-['Cinzel_Decorative'] text-3xl gold-shimmer mb-2" data-reveal="up">Zainab & Ibrahim</p>
          <p className="text-sm mb-4" style={{ color:"var(--gold)", opacity:.55 }}>15 March 2025 · Istanbul, Turkey</p>
          <p className="text-sm" style={{ color:"var(--cream)", opacity:.3 }}>wedding@alnoorpalace.com · +90 212 555 0178</p>
        </div>
      </footer>
    </div>
  );
}
