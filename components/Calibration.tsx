
import React, { useEffect, useRef, useState } from 'react';

interface CalibrationProps {
  onComplete: () => void;
  userName: string;
}

export const Calibration: React.FC<CalibrationProps> = ({ onComplete, userName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [balance, setBalance] = useState(1); // 1 = chaos, 0 = aligned
  const [isCalibrating, setIsCalibrating] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const oscNodeRef = useRef<OscillatorNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const oscGainRef = useRef<GainNode | null>(null);
  const alignedTimeRef = useRef(0);

  // 初始化音频系统
  const initAudio = () => {
    if (audioCtxRef.current) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtxRef.current = new Ctx();
    const ctx = audioCtxRef.current!;

    // 1. 创建白噪音 (Chaos)
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.1;
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseNodeRef.current = noise;
    noiseGainRef.current = noiseGain;
    noise.start();

    // 2. 创建 432Hz 正弦波 (Order)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 432;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0;
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    oscNodeRef.current = osc;
    oscGainRef.current = oscGain;
    osc.start();

    setIsCalibrating(true);
  };

  // 视觉绘制循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (!ctx || !canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 绘制噪点
      // 平衡度越差(balance -> 1)，噪点越多、越散乱
      // 平衡度越好(balance -> 0)，噪点收束成线
      const particleCount = 200 + balance * 800;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + balance * 0.5})`;

      for (let i = 0; i < particleCount; i++) {
        // 垂直分布：balance 越大，分布越广；balance=0 时，集中在 centerY
        const spreadY = (Math.random() - 0.5) * h * (0.02 + balance * 0.98); 
        const x = Math.random() * w;
        const y = centerY + spreadY;
        
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
      }

      // 绘制中心线 (Success Indicator)
      if (balance < 0.2) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - balance * 5})`;
        ctx.lineWidth = 1;
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [balance]);

  // 音频混合逻辑 & 成功判定
  useEffect(() => {
    if (noiseGainRef.current && oscGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      // 杂讯随不平衡度增加
      noiseGainRef.current.gain.setTargetAtTime(balance * 0.15, now, 0.1);
      // 纯音随平衡度增加 (1 - balance)
      oscGainRef.current.gain.setTargetAtTime((1 - balance) * 0.2, now, 0.1);
    }

    if (balance < 0.05) {
      alignedTimeRef.current += 16; // approx 1 frame
      if (alignedTimeRef.current > 1500) { // 保持 1.5秒
         // 成功淡出
         if (audioCtxRef.current) {
           noiseGainRef.current?.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
           oscGainRef.current?.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1);
         }
         onComplete();
      }
    } else {
      alignedTimeRef.current = 0;
    }
  }, [balance, onComplete]);

  // 传感器/鼠标监听
  useEffect(() => {
    const handleMove = (x: number, y: number, maxX: number, maxY: number) => {
       // 计算偏离中心的程度 (0 ~ 1)
       // 简单模拟：鼠标/手机越接近水平/中心，值越小
       const centerX = maxX / 2;
       const centerY = maxY / 2;
       const distY = Math.abs(y - centerY) / centerY; // 0 is center
       // 增加一些平滑
       setBalance(prev => prev * 0.9 + distY * 0.1);
    };

    const handleMouse = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Beta is front-to-back tilt [-180, 180]. Flat is 0.
      const tilt = Math.abs(e.beta || 0);
      // Normalize tilt: 0 is good. > 20 is bad.
      const normalized = Math.min(1, tilt / 20);
      setBalance(prev => prev * 0.9 + normalized * 0.1);
    };

    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('deviceorientation', handleOrientation);
      if (audioCtxRef.current) {
         audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      {!isCalibrating && (
        <button 
          onClick={initAudio}
          className="relative z-10 px-10 py-4 border border-white/20 text-white/60 mono text-xs tracking-[0.2em] uppercase hover:bg-white/5 hover:text-white transition-all animate-in fade-in zoom-in duration-700"
        >
          Initialize Link :: {userName || 'GUEST'}
        </button>
      )}

      {isCalibrating && (
        <div className="absolute bottom-12 text-center pointer-events-none">
           <p className="mono text-[10px] text-white/30 tracking-[0.8em] uppercase flicker-slow">
             {balance < 0.1 ? `SYNCING_${userName ? userName.toUpperCase() : 'USER'}` : "CALIBRATE_HORIZON"}
           </p>
        </div>
      )}
    </div>
  );
};
