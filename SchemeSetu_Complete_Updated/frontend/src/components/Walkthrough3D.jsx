import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  { kicker: "01 / THE IDEA", title: "Every big business\nbegins somewhere.", body: "You have the ambition. We help you find a practical place to begin.", accent: "#d6a85f" },
  { kicker: "02 / THE DISCOVERY", title: "Find support that\nfits your ambition.", body: "Explore government schemes, loans and subsidies that may fit your profile.", accent: "#82b7a0" },
  { kicker: "03 / THE MATCH", title: "Understand what\nyou may be eligible for.", body: "Compare benefits, eligibility conditions and requirements in plain language.", accent: "#d6a85f" },
  { kicker: "04 / THE NEXT STEP", title: "Turn uncertainty\ninto a clear next step.", body: "Prepare documents and find guidance on where and how to apply.", accent: "#82b7a0" },
];

function makeLabelTexture(title, subtitle, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#102b2b"; ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = accent; ctx.lineWidth = 8; ctx.strokeRect(24, 24, 976, 464);
  ctx.fillStyle = accent; ctx.font = "bold 30px Arial"; ctx.fillText("SCHEMESETU  /  OPPORTUNITY SPACE", 72, 105);
  ctx.fillStyle = "#f4f0e7"; ctx.font = "bold 68px Georgia";
  const words = title.split(" "); let line = "", y = 235;
  for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > 850) { ctx.fillText(line, 72, y); y += 78; line = word; } else line = test; }
  if (line) ctx.fillText(line, 72, y);
  ctx.fillStyle = "#9fb5aa"; ctx.font = "28px Arial"; ctx.fillText(subtitle, 72, 425);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function createRoom(scene, z, index) {
  const group = new THREE.Group(); group.position.z = z; scene.add(group);
  const dark = new THREE.MeshStandardMaterial({ color: 0x172f30, roughness: .82, metalness: .08 });
  const side = new THREE.MeshStandardMaterial({ color: 0x203d3b, roughness: .9 });
  const floor = new THREE.MeshStandardMaterial({ color: 0x243c39, roughness: .88 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc99548, metalness: .55, roughness: .35, emissive: 0x3b2108 });
  const mint = new THREE.MeshStandardMaterial({ color: 0x7ba994, metalness: .25, roughness: .45, emissive: 0x10251d });
  const addBox = (w,h,d,x,y,zz,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,zz); m.castShadow=true; m.receiveShadow=true; group.add(m); return m; };
  addBox(13,.35,17,0,-3.5,0,floor);
  addBox(.35,7,17,-6.5,0,0,side); addBox(.35,7,17,6.5,0,0,side); addBox(13,.3,17,0,3.5,0,dark);
  addBox(13,7,.35,0,0,-8.3,dark);
  // Architectural ribs and warm ceiling strips
  for(let i=0;i<5;i++){ const zz=3-i*2.7; addBox(13,.08,.12,0,3.28,zz,gold); }
  const light = new THREE.PointLight(index%2?0x83b99e:0xd5a45c, 34, 17, 2); light.position.set(0,2.5,-2); group.add(light);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(5.3,2.65), new THREE.MeshBasicMaterial({map:makeLabelTexture(chapters[index].title.replace("\n"," "), chapters[index].kicker, chapters[index].accent)}));
  panel.position.set(0,.25,-5.2); group.add(panel);
  // Floating scheme tokens, rings and a small plinth
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15,.045,12,80), gold); ring.position.set(-3.1,.6,-4.4); ring.rotation.y=-.25; group.add(ring);
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1), mint); orb.position.set(3.15,.2,-4.7); group.add(orb);
  const plinth = addBox(1.5,.8,1.5,3.1,-2.9,-4.7,side);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.22,24,24),gold); bead.position.set(3.1,-1.9,-4.7); group.add(bead);
  // Doorway frame to visually connect each chapter
  const frameMat = new THREE.MeshStandardMaterial({color:0x52766a, metalness:.5, roughness:.4, emissive:0x102a22});
  addBox( .16,5.4,.22,-2.65,-.1,-8.05,frameMat); addBox(.16,5.4,.22,2.65,-.1,-8.05,frameMat); addBox(5.4,.16,.22,0,2.55,-8.05,frameMat);
  return group;
}

export default function Walkthrough3D() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const copyRefs = useRef([]);
  const activeRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(section.clientWidth, section.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x081516);
    scene.fog = new THREE.FogExp2(0x081516, 0.018);
    const camera = new THREE.PerspectiveCamera(56, section.clientWidth / section.clientHeight, 0.1, 120);
    camera.position.set(0, 0.15, 9.5);
    camera.lookAt(0, 0, -2);

    scene.add(new THREE.HemisphereLight(0xb8d8ca, 0x071011, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffd69a, 2.2);
    keyLight.position.set(-4, 7, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x4d9a83, 24, 35, 2);
    fillLight.position.set(4, 1, -18);
    scene.add(fillLight);

    const rooms = chapters.map((_, index) => createRoom(scene, -index * 16, index));
    // A continuous corridor floor and guide lights make the four spaces read as one journey.
    const corridorMat = new THREE.MeshStandardMaterial({ color: 0x142b29, roughness: 0.9, metalness: 0.08 });
    const corridor = new THREE.Mesh(new THREE.PlaneGeometry(13, 70), corridorMat);
    corridor.rotation.x = -Math.PI / 2;
    corridor.position.set(0, -3.31, -24);
    corridor.receiveShadow = true;
    scene.add(corridor);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xc99548, emissive: 0x6b3d0b, emissiveIntensity: 0.8, metalness: 0.65, roughness: 0.32 });
    [-6.05, 6.05].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 68), railMat);
      rail.position.set(x, -3.05, -24);
      scene.add(rail);
    });

    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = [];
    for (let i = 0; i < 180; i++) particlePositions.push((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 7, -Math.random() * 66);
    particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xd6a85f, size: 0.045, transparent: true, opacity: 0.7 }));
    scene.add(particles);

    // Text panels are deliberately switched one-at-a-time; no overlapping chapter tweens.
    copyRefs.current.forEach((element, index) => {
      if (!element) return;
      gsap.set(element, { autoAlpha: index === 0 ? 1 : 0, y: index === 0 ? 0 : 18 });
      element.setAttribute("aria-hidden", index === 0 ? "false" : "true");
    });
    const setActiveChapter = (next) => {
      if (next === activeRef.current) return;
      const previous = activeRef.current;
      activeRef.current = next;
      const oldElement = copyRefs.current[previous];
      const newElement = copyRefs.current[next];
      if (oldElement) {
        oldElement.setAttribute("aria-hidden", "true");
        gsap.to(oldElement, { autoAlpha: 0, y: -12, duration: reducedMotion ? 0 : 0.22, overwrite: true, ease: "power2.in" });
      }
      if (newElement) {
        newElement.setAttribute("aria-hidden", "false");
        gsap.fromTo(newElement, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: reducedMotion ? 0 : 0.34, overwrite: true, ease: "power2.out" });
      }
    };

    let rafId = 0;
    const render = () => {
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    render();

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=3200",
        pin: true,
        scrub: reducedMotion ? false : 1.1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          const progress = self.progress;
          const chapterIndex = Math.min(3, Math.floor(progress * 4));
          setActiveChapter(chapterIndex);
          const targetZ = 9.5 - progress * 58;
          camera.position.z = targetZ;
          camera.position.x = Math.sin(progress * Math.PI * 4) * 0.28;
          camera.rotation.y = Math.sin(progress * Math.PI * 2) * 0.012;
          particles.rotation.y = progress * 0.12;
        }
      });
    }, section);

    const resize = () => {
      const width = section.clientWidth;
      const height = section.clientHeight;
      camera.aspect = width / height;
      camera.fov = width < 700 ? 66 : 56;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", resize);
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("resize", resize);
      context.revert();
      cancelAnimationFrame(rafId);
      renderer.dispose();
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      ScrollTrigger.refresh();
    };
  }, []);

  return <section className="ss-walkthrough" ref={sectionRef} aria-label="SchemeSetu 3D business support walkthrough">
    <canvas className="ss-walkthrough-canvas" ref={canvasRef} aria-hidden="true" />
    <div className="ss-walkthrough-top"><span>SCHEMESETU / THE WALKTHROUGH</span><span>SCROLL TO EXPLORE <b>↓</b></span></div>
    <div className="ss-walkthrough-copy">
      {chapters.map((chapter, index) => <article className="ss-walkthrough-chapter" key={chapter.kicker} ref={element => { copyRefs.current[index] = element; }} aria-hidden={index !== 0}>
        <span className="ss-eyebrow">{chapter.kicker}</span>
        <h2>{chapter.title.split("\n").map((line, lineIndex) => <span key={lineIndex}>{line}{lineIndex === 0 && <br />}</span>)}</h2>
        <p>{chapter.body}</p>
        <div className="ss-chapter-progress"><i style={{ width: `${(index + 1) * 25}%` }} /></div>
        <small>SCROLL TO CONTINUE · 0{index + 1} / 04</small>
      </article>)}
    </div>
    <div className="ss-walkthrough-bottom"><span>YOUR IDEA HAS A PLACE TO BEGIN.</span><span>SCHEMESETU <b>✦</b></span></div>
  </section>;
}
