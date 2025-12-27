
import React, { useState, useEffect, useRef } from 'react';
import { OnboardingStage, ManifestSignal, EchoRecord, AmbientParams } from './types.ts';
import { Waveform } from './components/Waveform.tsx';
import { Calibration } from './components/Calibration.tsx';
import { GoogleGenAI } from "@google/genai";

const TUNING_PHRASES = [
  "现实中存在无数可能",
  "但只有极少数",
  "会进入你的视野",
  "你不是没机会，是没对准。"
];

const SENSORY_QUESTIONS = [
  { 
    id: 'visual', 
    label: '核心视界 / Visual Anchor', 
    q: '想象你已瞬间穿越到那个时刻。当你的眼睛适应那里的光线，第一个映入眼帘的细节是什么？', 
    hint: '描述它的颜色、材质，光线是如何在它表面流动的？它离你有多远？',
    followUpHint: '寻找一个反光点或阴影的边缘。它是锐利的还是模糊的？观察这种光感如何在你的视网膜上留下确凿的真实印记。'
  },
  { 
    id: 'sense', 
    label: '体感谐振 / Somatic Resonance', 
    q: '现在的你，正站立或坐在这个未来的时空。你的身体有什么真实的感觉？', 
    hint: '指尖触碰到了什么质地？空气的温度是多少？脚下的地面是坚实还是柔软？呼吸时，胸腔的起伏是怎样的？',
    followUpHint: '感受衣服纤维与皮肤的摩擦。你的重心分布在何处？深吸一口气，感受那股属于未来的空气如何充盈你的肺部，带走所有的不确定。'
  },
  { 
    id: 'auditory', 
    label: '环境音场 / Auditory Field', 
    q: '静下心来。在这个现实里，你的耳朵捕捉到了什么声音？', 
    hint: '是远处城市的低鸣，是某个人的低语，还是某种设备运作的频率？这种声音带给你怎样的安全感？',
    followUpHint: '分辨声音的层级——哪一个是在近处，哪一个又在极远方？空间的回响感如何定义了这个场域的大小？'
  },
  { 
    id: 'detail', 
    label: '深度解析 / Neural Detail', 
    q: '最后，寻找一个极其微小却无法忽视的细节。那个场景闻起来是什么味道？', 
    hint: '是清晨的冷冽，还是某种香气、咖啡的苦涩，或是书页的味道？这种气味如何确证了你已“抵达”？',
    followUpHint: '这种味道是否唤起了某种特定的温度感或记忆？这正是 RAS 神经系统最核心的锚点，让大脑相信这不再是幻影，而是既定的现实。'
  }
];

// Helper: Particle Burst Component
const ParticleBurst = () => {
  const particles = Array.from({ length: 40 }).map((_, i) => {
    const angle = (i / 40) * 360;
    const distance = 80 + Math.random() * 120;
    const tx = Math.cos(angle * (Math.PI / 180)) * distance;
    const ty = Math.sin(angle * (Math.PI / 180)) * distance;
    return (
      <div
        key={i}
        className="particle"
        style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${Math.random() * 0.1}s` } as React.CSSProperties}
      />
    );
  });
  return <>{particles}</>;
};

// Helper: Ambient Particles
const AmbientParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="ambient-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            opacity: Math.random() * 0.5,
            animationDuration: `${5 + Math.random() * 5}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
};

// NEW: Typing Sparks Effect for TypewriterText
const TypingParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
       {Array.from({length: 3}).map((_, i) => (
         <div 
           key={Date.now() + i}
           className="typing-spark"
           style={{
             left: `${Math.random() * 100}%`,
             top: `${Math.random() * 100}%`,
             '--tx': `${(Math.random() - 0.5) * 15}px`, // Reduced spread for tighter effect
             '--ty': `${-5 - Math.random() * 15}px`,
             animationDelay: `${Math.random() * 0.2}s`
           } as React.CSSProperties} 
         />
       ))}
    </div>
  );
};

// Helper: Typewriter Text Component with Character Reveal & Particles
const TypewriterText = ({ text, className, speed = 30, delay = 0, as: Tag = 'div' }: { text: string, className?: string, speed?: number, delay?: number, as?: any }) => {
  const [displayedChars, setDisplayedChars] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedChars([]);
    setIsComplete(false);
    
    const startTime = Date.now() + delay;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now < startTime) return;

      const elapsed = now - startTime;
      const charIndex = Math.floor(elapsed / speed);

      if (charIndex < text.length) {
        setDisplayedChars(text.slice(0, charIndex + 1).split(''));
      } else {
        setDisplayedChars(text.split(''));
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 20); // Check loop faster than type speed for precision

    return () => clearInterval(interval);
  }, [text, speed, delay]);

  return (
    <Tag className={`relative ${className}`}>
      {displayedChars.map((char, index) => (
        <span key={index} className="char-reveal">{char}</span>
      ))}
      {!isComplete && (
        <>
          <span className="animate-pulse text-white/50 inline-block ml-[1px] align-baseline">_</span>
          <TypingParticles />
        </>
      )}
    </Tag>
  );
};


// NEW: Data HUD Component for Dashboard interaction
// Uses direct DOM manipulation for performance
const DataHud = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);
  const hashRef = useRef<HTMLSpanElement>(null);
  const freqRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      if (xRef.current) xRef.current.innerText = `X:${clientX.toString().padStart(4, '0')}`;
      if (yRef.current) yRef.current.innerText = `Y:${clientY.toString().padStart(4, '0')}`;
      
      // Random jitters based on movement
      if (Math.random() > 0.5 && hashRef.current) {
         hashRef.current.innerText = `0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0')}`;
      }
      if (Math.random() > 0.7 && freqRef.current) {
         freqRef.current.innerText = `${(432 + (clientX / window.innerWidth) * 10 - 5).toFixed(2)}Hz`;
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove); // Add touch support
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[10] overflow-hidden opacity-30 mix-blend-screen">
       {/* Top Right Data Block */}
       <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
          <div className="flex gap-4 mono text-[9px] text-white/50 tracking-widest">
            <span ref={xRef}>X:0000</span>
            <span ref={yRef}>Y:0000</span>
          </div>
          <div className="mono text-[8px] text-white/30 tracking-[0.2em]">SPATIAL_TRACKING_ACTIVE</div>
       </div>

       {/* Bottom Left Data Block */}
       <div className="absolute bottom-6 left-6 flex flex-col gap-1">
          <div className="flex gap-2 items-center">
             <div className="w-1 h-1 bg-white/50 animate-pulse rounded-full"></div>
             <span ref={freqRef} className="mono text-[9px] text-white/60 tracking-wider">432.00Hz</span>
          </div>
          <span ref={hashRef} className="mono text-[8px] text-white/20 uppercase tracking-widest">0xA4B2C1</span>
       </div>

       {/* Center Crosshair (Dynamic) */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] border border-white/[0.03] rounded-3xl">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [stage, setStage] = useState<OnboardingStage>(OnboardingStage.INTRO_1);
  const [userName, setUserName] = useState('');
  const [duration, setDuration] = useState(21);
  const [tuneX, setTuneX] = useState(10);
  const [progress, setProgress] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({ visual: '', sense: '', auditory: '', detail: '' });
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [activeSignal, setActiveSignal] = useState<ManifestSignal | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [observeTime, setObserveTime] = useState(10.0); // Use float for smoother progress
  const [showEchoModal, setShowEchoModal] = useState(false);
  const [echoInput, setEchoInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Transitions
  const [isTransitioning, setIsTransitioning] = useState(false); // Controls guided input animations

  // Reveal Interaction State (STABLE stage)
  const [revealProgress, setRevealProgress] = useState(0);
  
  // Observing State (OBSERVING stage)
  const observingIntervalRef = useRef<number | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Reminder State
  const [reminderTime, setReminderTime] = useState('21:00');
  const [lastRemindedDate, setLastRemindedDate] = useState('');

  const tuningAreaRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastHapticRef = useRef(0); // Throttle haptics

  const TARGET_X = 72;
  const intensity = Math.max(0, 1 - Math.abs(tuneX - TARGET_X) / 25);
  const tuningPhraseIndex = Math.min(TUNING_PHRASES.length - 1, Math.floor((tuneX / 100.1) * TUNING_PHRASES.length));

  useEffect(() => {
    const saved = localStorage.getItem('FLOW_STATE_SIGNAL_V7');
    if (saved) {
      const data = JSON.parse(saved);
      setActiveSignal(data);
      if (data.userName) setUserName(data.userName);
      setStage(OnboardingStage.DASHBOARD);
      generateDailyQuestion(data);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript;
            setInputs(prev => {
              const currentId = SENSORY_QUESTIONS[currentQIdx].id;
              return { ...prev, [currentId]: (prev[currentId] + final).trim() };
            });
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    // Request Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [currentQIdx]);

  useEffect(() => {
    let timer: number;
    switch (stage) {
      case OnboardingStage.INTRO_1:
        timer = window.setTimeout(() => setStage(OnboardingStage.CALIBRATION), 3000);
        break;
      case OnboardingStage.INTRO_2:
        timer = window.setTimeout(() => setStage(OnboardingStage.TUNING), 4000);
        break;
      case OnboardingStage.LOCKED:
        // Logic fix: if signal exists (Restarting), go to Dashboard. Else go to Definition.
        if (activeSignal) {
          timer = window.setTimeout(() => setStage(OnboardingStage.DASHBOARD), 2000);
        } else {
          timer = window.setTimeout(() => setStage(OnboardingStage.DEFINITION), 3000);
        }
        break;
      case OnboardingStage.DEFINITION:
        timer = window.setTimeout(() => setStage(OnboardingStage.GUIDED_INPUT), 4000);
        break;
      default:
        break;
    }
    return () => clearTimeout(timer);
  }, [stage, activeSignal]);

  useEffect(() => {
    if (stage === OnboardingStage.TUNING && intensity > 0.9) {
      const timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(timer);
            setStage(OnboardingStage.LOCKED);
            triggerHaptic([30, 20, 100]);
            return 100;
          }
          return p + 2.5;
        });
      }, 30);
      return () => clearInterval(timer);
    } else {
      setProgress(p => Math.max(0, p - 5));
    }
  }, [intensity, stage]);

  // === Observing Stage Hold Logic ===
  const startObservingFocus = () => {
    if (stage !== OnboardingStage.OBSERVING) return;
    if (observingIntervalRef.current) clearInterval(observingIntervalRef.current);
    
    // Audio feedback ramping up
    if (audioContext.current && oscRef.current && gainRef.current) {
      gainRef.current.gain.cancelScheduledValues(audioContext.current.currentTime);
      gainRef.current.gain.linearRampToValueAtTime(0.1, audioContext.current.currentTime + 0.1);
    }

    triggerHaptic([10]);

    observingIntervalRef.current = window.setInterval(() => {
      setObserveTime(prev => {
        if (prev <= 0) {
          if (observingIntervalRef.current) clearInterval(observingIntervalRef.current);
          finishObservation();
          return 0;
        }
        
        // Modulate Frequency based on progress (10 -> 0)
        // Closer to 0 = Higher Frequency (more focus)
        if (oscRef.current && audioContext.current) {
          const freq = 200 + (10 - prev) * 40; // 200Hz to 600Hz
          oscRef.current.frequency.setTargetAtTime(freq, audioContext.current.currentTime, 0.1);
        }

        return prev - 0.05; // Decrease time
      });
      // Random subtle vibration while holding
      if (Math.random() > 0.8) triggerHaptic([5]);
    }, 20);
  };

  const stopObservingFocus = () => {
    if (stage !== OnboardingStage.OBSERVING) return;
    if (observingIntervalRef.current) clearInterval(observingIntervalRef.current);
    
    // Audio feedback winding down
    if (audioContext.current && oscRef.current && gainRef.current) {
      gainRef.current.gain.cancelScheduledValues(audioContext.current.currentTime);
      gainRef.current.gain.linearRampToValueAtTime(0.02, audioContext.current.currentTime + 0.5);
      oscRef.current.frequency.setTargetAtTime(200, audioContext.current.currentTime, 0.5);
    }

    // Decay back to 10
    observingIntervalRef.current = window.setInterval(() => {
      setObserveTime(prev => {
        if (prev >= 10.0) {
          if (observingIntervalRef.current) clearInterval(observingIntervalRef.current);
          return 10.0;
        }
        return prev + 0.2; // Fast decay
      });
    }, 20);
  };


  // === Stable Stage Reveal Logic ===
  const startReveal = () => {
    if (revealProgress >= 100) return;
    const interval = window.setInterval(() => {
      setRevealProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          triggerHaptic([50, 50, 50]);
          setStage(OnboardingStage.DASHBOARD);
          return 100;
        }
        return prev + 1.5; 
      });
      if (Math.random() > 0.7) triggerHaptic([5]);
    }, 30);
    // @ts-ignore
    window.revealInterval = interval;
  };

  const endReveal = () => {
    // @ts-ignore
    if (window.revealInterval) clearInterval(window.revealInterval);
    const decayInterval = setInterval(() => {
      setRevealProgress(prev => {
        if (prev <= 0) {
          clearInterval(decayInterval);
          return 0;
        }
        return prev - 5;
      });
    }, 16);
  };

  // Daily Reminder Logic
  useEffect(() => {
    if (!activeSignal || stage !== OnboardingStage.DASHBOARD) return;

    const checkReminder = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const dateStr = now.toLocaleDateString('zh-CN');
      
      const hasDoneToday = activeSignal.observationHistory.includes(dateStr);

      if (timeStr === reminderTime && !hasDoneToday && lastRemindedDate !== dateStr) {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('Flow State :: Resonance Check', {
            body: `It's time to align with your signal: "${activeSignal.refinedSignal.substring(0, 30)}..."`,
            icon: '/icon.png', // Optional placeholder
            tag: 'flow-state-reminder'
          });
          
          notification.onclick = () => {
            window.focus();
            startObservation();
            notification.close();
          };
          
          setLastRemindedDate(dateStr);
        }
      }
    };

    const interval = setInterval(checkReminder, 10000);
    return () => clearInterval(interval);
  }, [activeSignal, stage, reminderTime, lastRemindedDate]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("您的浏览器不支持语音识别。建议使用 Chrome。");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      triggerHaptic([10]);
    }
  };

  const triggerHaptic = (pattern: number[]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  // --- Optimized Tuning Interaction (Pointer Events for smoothness) ---
  const handleTuningPointerDown = (e: React.PointerEvent) => {
    if (!tuningAreaRef.current || stage !== OnboardingStage.TUNING) return;
    
    // Crucial: Lock pointer to this element so dragging outside the box still works
    e.currentTarget.setPointerCapture(e.pointerId);
    
    updateTuningFromEvent(e);
  };

  const handleTuningPointerMove = (e: React.PointerEvent) => {
    // Update if button is pressed (dragging) OR if hovering (mouse only)
    if (e.buttons > 0 || e.pointerType === 'mouse') {
      updateTuningFromEvent(e);
    }
  };

  const handleTuningPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateTuningFromEvent = (e: React.PointerEvent) => {
    if (!tuningAreaRef.current) return;
    
    const rect = tuningAreaRef.current.getBoundingClientRect();
    // Clamp values to prevent glitching when dragging way outside
    const rawX = e.clientX;
    const x = ((rawX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(0, Math.min(100, x));
    
    setTuneX(clampedX);
    
    // Calculate intensity for haptics
    const currentIntensity = Math.max(0, 1 - Math.abs(clampedX - TARGET_X) / 25);
    
    // Throttle haptics to max once every 50ms to prevent main thread jank
    const now = Date.now();
    if (currentIntensity > 0.8 && (now - lastHapticRef.current > 50)) {
       triggerHaptic([5]);
       lastHapticRef.current = now;
    }
  };


  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playAmbientSound = (params: AmbientParams) => {
    if (!audioContext.current) audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContext.current;

    if (ambientNodeRef.current) {
       try { (ambientNodeRef.current as AudioBufferSourceNode).stop(); } catch(e) {}
       ambientNodeRef.current = null;
    }

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0;

    for (let i = 0; i < bufferSize; i++) {
       if (params.type === 'white') {
         data[i] = Math.random() * 2 - 1;
       } else if (params.type === 'pink') {
         const white = Math.random() * 2 - 1;
         data[i] = (lastOut + (0.02 * white)) / 1.02;
         lastOut = data[i];
         data[i] *= 3.5; 
       } else {
         const white = Math.random() * 2 - 1;
         data[i] = (lastOut + (0.02 * white)) / 1.02;
         lastOut = data[i];
         data[i] *= 3.5; 
       }
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = params.type === 'white' ? 'highpass' : 'lowpass';
    filter.frequency.value = params.filterFreq;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
    ambientNodeRef.current = noise;
  };

  const stopAmbientSound = () => {
    if (ambientNodeRef.current) {
       try { (ambientNodeRef.current as AudioBufferSourceNode).stop(); } catch(e) {}
       ambientNodeRef.current = null;
    }
    // Also stop any oscillator from observation mode
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch(e) {}
      oscRef.current = null;
    }
  };

  const generateDailyQuestion = async (signal: ManifestSignal) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `基于愿景：“${signal.refinedSignal}”。请写一个极其具体、带有呼吸感的提问，引导用户在此刻寻找相似的感官细节。不超过12字，不要用AI腔。`,
      });
      setDailyQuestion(response.text || "此刻，周围的光流向哪里？");
    } catch (e) {
      setDailyQuestion("闭上眼，那个时刻的风是什么味道？");
    }
  };

  const triggerEmissionVisuals = () => {
    const beam = document.getElementById('beam');
    const ripple1 = document.getElementById('ripple1');
    const ripple2 = document.getElementById('ripple2');
    const stars = document.getElementById('stars');
    
    beam?.classList.add('active');
    ripple1?.classList.add('active');
    ripple2?.classList.add('active');
    if (stars) stars.style.opacity = '1';
    
    triggerHaptic([10, 50, 10, 100, 10, 200]);

    setTimeout(() => {
      beam?.classList.remove('active');
      ripple1?.classList.remove('active');
      ripple2?.classList.remove('active');
      if (stars) stars.style.opacity = '0.3';
    }, 3000);
  };

  // 核心逻辑：切换问题的转场动画
  const handleNextQuestion = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    triggerHaptic([10]); // 轻微触觉，开始“穿越”

    setTimeout(() => {
      if (currentQIdx < SENSORY_QUESTIONS.length - 1) {
        setCurrentQIdx(v => v + 1);
        // 短暂延迟后移除转场状态，触发新页面的 Enter 动画
        setTimeout(() => setIsTransitioning(false), 50); 
      } else {
        handleLaunch();
      }
    }, 800); // 必须匹配 CSS 动画时长
  };

  const handleLaunch = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    // 重置 transition 状态以防万一
    setIsTransitioning(false); 
    
    setStage(OnboardingStage.EMISSION);
    triggerEmissionVisuals();

    let newSignal: ManifestSignal;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const combined = `视觉: ${inputs.visual} | 体感: ${inputs.sense} | 听觉: ${inputs.auditory} | 气味: ${inputs.detail}`;
      
      const textPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `你是一名深层意识引导师。基于这些感官输入，描述一个极其真实的、第一人称的成功瞬间。要求：口语化、充满感官冲击力、30字以内。输入：${combined}`,
        config: { thinkingConfig: { thinkingBudget: 100 } }
      });

      const audioPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this sensory input: "${combined}". Choose the best ambient sound parameters. Return ONLY JSON.
        Options:
        - type: "white" (rain/hiss), "pink" (wind/nature), "brown" (city/rumble)
        - filterFreq: number (200-1000 for lowpass, 1000-5000 for highpass)
        Example: {"type": "pink", "filterFreq": 400, "modulation": true}`,
        config: { responseMimeType: "application/json" }
      });

      const [textRes, audioRes] = await Promise.all([textPromise, audioPromise]);

      const refinedText = textRes.text?.trim() || "你就站在光里，一切感官细节都如约而至。";
      let ambientParams: AmbientParams = { type: 'pink', filterFreq: 400, modulation: true };
      
      try {
        if (audioRes.text) ambientParams = JSON.parse(audioRes.text);
      } catch (e) { console.warn("Audio param parse failed", e); }

      playAmbientSound(ambientParams);

      newSignal = {
        id: Math.random().toString(16).substring(2, 8).toUpperCase(),
        userName,
        targetGoal: inputs.visual,
        durationDays: duration,
        refinedSignal: refinedText,
        createdAt: Date.now(),
        manifestCount: 0,
        streak: 0,
        observationHistory: [],
        echos: [],
        progress: 0,
        ambientParams
      };
      
    } catch (e) {
      console.error("AI Launch Error:", e);
      newSignal = {
        id: Math.random().toString(16).substring(2, 8).toUpperCase(),
        userName,
        targetGoal: inputs.visual || "我的目标",
        durationDays: duration,
        refinedSignal: "那一刻，你已抵达。所有的感官都在确证这份真实。",
        createdAt: Date.now(),
        manifestCount: 0,
        streak: 0,
        observationHistory: [],
        echos: [],
        progress: 0,
        ambientParams: { type: 'pink', filterFreq: 400, modulation: false }
      };
      playAmbientSound(newSignal.ambientParams!);
    } finally {
      setActiveSignal(newSignal!);
      localStorage.setItem('FLOW_STATE_SIGNAL_V7', JSON.stringify(newSignal!));
      
      setTimeout(() => {
        setStage(OnboardingStage.STABLE);
        setIsLaunching(false);
      }, 3000);
    }
  };

  const startObservation = () => {
    setStage(OnboardingStage.OBSERVING);
    setObserveTime(10.0);
    speakText(dailyQuestion);
    
    // Setup Audio
    if (!audioContext.current) audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioContext.current.currentTime); // Start low
    
    gain.gain.setValueAtTime(0, audioContext.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, audioContext.current.currentTime + 1); // Fade in low
    
    osc.connect(gain);
    gain.connect(audioContext.current.destination);
    osc.start();
    
    oscRef.current = osc;
    gainRef.current = gain;
    
    // Don't auto-decrement. Waiting for hold.
  };

  const finishObservation = () => {
    if (audioContext.current && gainRef.current && oscRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.5);
      setTimeout(() => {
         try { oscRef.current?.stop(); } catch {}
      }, 500);
    }
    
    if (!activeSignal) return;
    const todayStr = new Date().toLocaleDateString('zh-CN');
    const isTodayRecorded = activeSignal.observationHistory.includes(todayStr);
    const newHistory = isTodayRecorded 
      ? activeSignal.observationHistory 
      : [...activeSignal.observationHistory, todayStr];

    const updated: ManifestSignal = {
      ...activeSignal,
      manifestCount: activeSignal.manifestCount + (isTodayRecorded ? 0 : 1),
      observationHistory: newHistory,
      lastObservedAt: Date.now(),
      progress: Math.min(100, (newHistory.length / activeSignal.durationDays) * 100)
    };
    
    setActiveSignal(updated);
    localStorage.setItem('FLOW_STATE_SIGNAL_V7', JSON.stringify(updated));
    
    triggerEmissionVisuals();
    
    setTimeout(() => {
      setStage(OnboardingStage.DASHBOARD);
      generateDailyQuestion(updated);
    }, 2000);
  };

  const handleRestart = () => {
    // Full Reset Logic for Demo
    triggerHaptic([20]);
    stopAmbientSound();
    localStorage.removeItem('FLOW_STATE_SIGNAL_V7');
    
    // Reset all state
    setActiveSignal(null);
    setUserName('');
    setInputs({ visual: '', sense: '', auditory: '', detail: '' });
    setCurrentQIdx(0);
    setTuneX(10);
    setProgress(0);
    setRevealProgress(0);
    setObserveTime(10.0);
    
    setStage(OnboardingStage.INTRO_1);
  };

  const renderCalendar = () => {
    if (!activeSignal) return null;
    const todayStr = new Date().toLocaleDateString('zh-CN');
    const isTodayDone = activeSignal.observationHistory.includes(todayStr);
    const totalDays = activeSignal.durationDays;
    const completedDaysCount = activeSignal.observationHistory.length;
    
    const gridDays = Array.from({ length: totalDays }, (_, i) => i);
    
    return (
      <div className="cal-grid">
        {gridDays.map(d => {
          const isDone = d < completedDaysCount;
          const isTodayTarget = d === completedDaysCount && !isTodayDone;
          const isTodayConfirmed = isTodayDone && d === (completedDaysCount - 1);

          return (
            <div 
              key={d} 
              className={`cal-day relative overflow-hidden transition-all duration-700 border
                ${isDone ? 'bg-white border-white active' : 'bg-white/[0.03] border-white/10'} 
                ${isTodayTarget ? 'border-white/40 border-dashed animate-pulse ring-1 ring-white/20 ring-offset-2 ring-offset-black' : ''}
                ${isTodayConfirmed ? 'shadow-[0_0_20px_rgba(255,255,255,0.6)] border-white ring-2 ring-white/30' : ''}
              `}
            >
               {isDone && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-black/60" />
                 </div>
               )}
               {(isTodayTarget || isTodayConfirmed) && (
                 <div className="absolute top-0 right-0 p-[2px]">
                   <div className="w-[4px] h-[4px] rounded-full bg-white animate-flicker" />
                 </div>
               )}
            </div>
          );
        })}
      </div>
    );
  };

  const todayStr = new Date().toLocaleDateString('zh-CN');
  const hasDoneToday = activeSignal?.observationHistory.includes(todayStr);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 relative transition-all duration-1000 ${stage === OnboardingStage.OBSERVING ? 'observing-bg' : 'bg-black'}`}>
      
      {/* 阶段 1.5: 物理校准 */}
      {stage === OnboardingStage.CALIBRATION && (
        <Calibration 
          onComplete={() => {
            // Logic fix: if signal exists (Restarting), skip Name Input.
            if (activeSignal) {
               setStage(OnboardingStage.INTRO_2);
            } else {
               setStage(OnboardingStage.NAME_INPUT);
            }
          }} 
          userName={userName} 
        />
      )}

      {/* 观测模式 (Hold to Focus) - Modified */}
      {stage === OnboardingStage.OBSERVING && activeSignal && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-1000 px-6 h-[100dvh] cursor-crosshair select-none"
          onMouseDown={startObservingFocus}
          onMouseUp={stopObservingFocus}
          onMouseLeave={stopObservingFocus}
          onTouchStart={startObservingFocus}
          onTouchEnd={stopObservingFocus}
          onContextMenu={(e) => e.preventDefault()}
        >
          <AmbientParticles />
          
          {/* Dynamic Blur Text Container */}
          <div className="relative z-10 text-center space-y-8 max-w-sm transition-all duration-100" style={{ 
            filter: `blur(${observeTime * 1.2}px) contrast(${1 + (10 - observeTime) * 0.1})`,
            opacity: 0.3 + (10 - observeTime) * 0.07,
            transform: `scale(${0.9 + (10 - observeTime) * 0.01})`
          }}>
            <h2 className="text-3xl font-extralight italic leading-relaxed text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
              “{activeSignal.refinedSignal}”
            </h2>
            <div className="h-[1px] w-12 bg-white/40 mx-auto" />
             <div className="space-y-4">
               <p className="text-[10px] text-white/50 mono tracking-widest uppercase">Target Reality</p>
               <p className="text-lg font-light text-white/80">{dailyQuestion}</p>
             </div>
          </div>

          {/* Central Focus Node (The "Singularity") */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
             <div 
               className="w-1 rounded-full bg-white shadow-[0_0_50px_white] transition-all duration-100"
               style={{ 
                 height: `${(10 - observeTime) * 20}px`,
                 opacity: 0.2 + (10 - observeTime) * 0.08,
                 width: '2px'
               }} 
             />
             <div 
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 transition-all duration-100"
               style={{
                 width: `${100 + observeTime * 20}px`,
                 height: `${100 + observeTime * 20}px`,
                 opacity: 0.5 - observeTime * 0.04,
                 transform: `translate(-50%, -50%) rotate(${observeTime * 30}deg)`
               }}
             />
          </div>

          <div className="absolute bottom-12 text-center pointer-events-none">
             {observeTime > 0.5 ? (
               <div className="space-y-2">
                 <p className="mono text-4xl font-thin text-white/20 tabular-nums">{observeTime.toFixed(1)}s</p>
                 <p className="mono text-[9px] tracking-[0.8em] uppercase text-white/40 animate-pulse">Hold_To_Focus</p>
               </div>
             ) : (
               <p className="mono text-[10px] tracking-[1em] uppercase text-white animate-ping">SYNC_COMPLETE</p>
             )}
          </div>
        </div>
      )}

      {/* 信号锁定画面：模拟相机对焦 + 绝对居中 + 准星动画 */}
      {stage === OnboardingStage.LOCKED && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md h-[100dvh]">
           {/* 背景准星线条 */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-white/20 to-transparent animate-crosshair-y" />
             <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent absolute animate-crosshair-x" />
           </div>

           {/* 核心对焦组件 */}
           <div className="relative flex items-center justify-center">
             {/* 动态收缩的取景框 */}
             <div className="absolute border border-white rounded-full animate-reticle-snap" />
             
             <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_60px_white] animate-ping" />
             <div className="absolute w-1.5 h-1.5 bg-white rounded-full" />
             <ParticleBurst />
           </div>

           <h2 className="text-xs font-bold tracking-[0.8em] uppercase mt-16 animate-cinematic-focus text-white/80">
             SIGNAL_LOCKED
           </h2>
        </div>
      )}

      {/* 主交互容器：添加key={stage}触发CSS转场动画 */}
      <div 
        key={stage}
        className={`relative z-50 max-w-md w-full h-full flex flex-col justify-center transition-all duration-700 ease-out 
          ${stage === OnboardingStage.OBSERVING ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          ${stage !== OnboardingStage.LOCKED ? 'animate-cinematic-focus' : ''} 
        `}
      >
        
        {stage === OnboardingStage.INTRO_1 && (
          <div className="space-y-6 text-center">
            <h1 className="text-2xl font-extralight tracking-[0.5em] uppercase flicker-slow">现实由关注定义</h1>
            <p className="text-[9px] text-white/20 tracking-[0.8em] uppercase">Observation Ready</p>
          </div>
        )}

        {stage === OnboardingStage.NAME_INPUT && (
          <div className="space-y-12 text-center">
            <div className="space-y-6">
              <p className="text-sm font-light tracking-[0.4em] uppercase text-white/20"> Identify Yourself / 观测者身份</p>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="键入姓名"
                className="w-full bg-transparent border-b border-white/10 py-4 text-center text-4xl font-extralight focus:outline-none focus:border-white/40 transition-all placeholder:text-neutral-900"
              />
            </div>
            <button 
              disabled={!userName}
              onClick={() => setStage(OnboardingStage.INTRO_2)}
              className="px-16 py-6 border border-white/10 mono text-[11px] tracking-[1em] uppercase hover:bg-white/5 active:bg-white/10 transition-all"
            >
              接入频率
            </button>
          </div>
        )}

        {stage === OnboardingStage.INTRO_2 && (
          <div className="space-y-10 text-center px-4">
             <h2 className="text-xl font-extralight tracking-[0.2em] leading-relaxed">
                {userName}，大脑会自动过滤不相关的杂讯。<br/>
                我们要从混沌中，<br/>
                拨出那个<span className="text-white">唯一的信号</span>。
             </h2>
             <div className="h-px w-8 bg-white/20 mx-auto" />
             <p className="mono text-[9px] text-white/30 uppercase tracking-widest flicker-slow">Synchronizing Neuro-Receiver...</p>
          </div>
        )}

        {stage === OnboardingStage.TUNING && (
          <div className="space-y-16 text-center px-4 select-none">
            <div className="h-24 flex items-center justify-center">
               <h1 className="text-xl font-extralight tracking-[0.4em] transition-all duration-500 text-white/90 min-h-[60px] flex items-center">
                  {TUNING_PHRASES[tuningPhraseIndex]}
               </h1>
            </div>
            <Waveform progress={progress} isLocked={false} isActive={true} intensity={intensity} />
            <div 
              ref={tuningAreaRef}
              onPointerDown={handleTuningPointerDown}
              onPointerMove={handleTuningPointerMove}
              onPointerUp={handleTuningPointerUp}
              onPointerLeave={handleTuningPointerUp}
              className="tuning-area flex items-center justify-center h-16 group cursor-ew-resize touch-none py-12 -my-8"
            >
              <div className="absolute inset-0 opacity-10 flex justify-between px-2 pointer-events-none">
                 {[...Array(30)].map((_, i) => <div key={i} className="h-full w-[1px] bg-white" />)}
              </div>
              
              <div 
                className="w-px h-24 bg-gradient-to-b from-transparent via-white to-transparent absolute shadow-[0_0_25px_#fff] transition-all duration-75 flex items-center justify-center pointer-events-none" 
                style={{ left: `${tuneX}%` }} 
              >
                 <div className="w-4 h-4 rounded-full border border-white/40 bg-black backdrop-blur-sm flex items-center justify-center animate-pulse group-active:scale-125 transition-transform">
                    <div className="w-1 h-1 bg-white rounded-full" />
                 </div>
              </div>
              
              <p className="mono text-[9px] text-white/30 uppercase tracking-[1em] pointer-events-none mt-24 absolute bottom-0">
                ← 滑动寻找频率 →
              </p>
            </div>
          </div>
        )}

        {/* LOCKED stage is handled by fixed overlay above */}

        {stage === OnboardingStage.DEFINITION && (
          <div className="text-center space-y-10 px-6">
             <p className="text-2xl font-extralight tracking-[0.5em] leading-relaxed uppercase">显化不是许愿</p>
             <p className="text-sm text-white/30 leading-loose tracking-widest uppercase italic">
                它是将模糊愿望<br/>调制为清晰、可被大脑接收的<br/>“感官数据”
             </p>
          </div>
        )}

        {stage === OnboardingStage.GUIDED_INPUT && (
          <div className="space-y-8 text-left px-4">
             {/* 引导式输入容器，应用 Mind Dive 动画 */}
             <div className={`transition-all duration-75 ${isTransitioning ? 'mind-dive-out' : 'mind-dive-in'}`}>
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="mono text-[10px] text-white/20 uppercase tracking-widest">{SENSORY_QUESTIONS[currentQIdx].label}</span>
                     <div className="flex gap-1">
                       {SENSORY_QUESTIONS.map((_, i) => (
                         <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i <= currentQIdx ? 'bg-white/40' : 'bg-white/5'}`} />
                       ))}
                     </div>
                   </div>
                   <TypewriterText 
                     as="h3"
                     text={SENSORY_QUESTIONS[currentQIdx].q}
                     className="text-xl font-extralight leading-snug tracking-wide min-h-[3.5rem]" 
                     speed={80}
                   />
                   <TypewriterText 
                     as="p"
                     text={SENSORY_QUESTIONS[currentQIdx].followUpHint}
                     className="text-[11px] text-white/30 italic mt-2 leading-relaxed mono uppercase tracking-tight min-h-[3rem]"
                     speed={50}
                     delay={1500}
                   />
                </div>
                
                <div className="relative group mt-8">
                  <textarea
                     autoFocus key={currentQIdx}
                     value={inputs[SENSORY_QUESTIONS[currentQIdx].id]}
                     onChange={(e) => setInputs({...inputs, [SENSORY_QUESTIONS[currentQIdx].id]: e.target.value})}
                     placeholder={SENSORY_QUESTIONS[currentQIdx].hint}
                     className={`w-full bg-white/[0.02] border-l border-white/10 pl-8 pr-16 py-6 text-lg font-extralight focus:outline-none h-48 resize-none placeholder:text-neutral-700 leading-relaxed transition-all focus:bg-white/[0.04] ${isRecording ? 'border-white/40' : ''}`}
                  />
                  <button 
                   onClick={toggleRecording}
                   className={`absolute right-4 bottom-4 p-4 rounded-full border border-white/10 transition-all hover:bg-white/5 ${isRecording ? 'voice-recording-active' : ''}`}
                  >
                    {isRecording ? (
                      <div className="flex gap-[2px]">
                        <div className="w-[2px] h-3 bg-white animate-[bounce_0.6s_infinite]" />
                        <div className="w-[2px] h-5 bg-white animate-[bounce_0.8s_infinite]" />
                        <div className="w-[2px] h-3 bg-white animate-[bounce_1s_infinite]" />
                      </div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" fill="white" fillOpacity="0.4"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
             </div>

             <div className="flex gap-4">
               {currentQIdx > 0 && (
                 <button onClick={() => setCurrentQIdx(v => v - 1)} className="px-6 py-5 border border-white/5 mono text-[10px] tracking-widest uppercase text-white/40 hover:text-white transition-colors">
                    Back
                 </button>
               )}
               <button 
                disabled={isLaunching || isTransitioning}
                onClick={handleNextQuestion}
                className="flex-1 py-6 bg-white/5 border border-white/10 mono text-[11px] tracking-[1.2em] uppercase font-bold hover:bg-white/10 active:bg-white/20 transition-all disabled:opacity-30"
               >
                  {currentQIdx === SENSORY_QUESTIONS.length - 1 ? (isLaunching ? '调制中...' : '启动深度对齐') : '确认输入'}
               </button>
             </div>
          </div>
        )}

        {stage === OnboardingStage.EMISSION && (
          <div className="text-center space-y-12 animate-pulse flex flex-col items-center">
            <div className="w-px h-24 bg-gradient-to-t from-white to-transparent shadow-[0_0_20px_#fff]" />
            <p className="mono text-[10px] tracking-[1.5em] text-white/80 uppercase">Launching_Signal</p>
            <p className="text-[9px] text-white/20 tracking-widest uppercase">Aligning Neural Pathways</p>
          </div>
        )}

        {stage === OnboardingStage.STABLE && activeSignal && (
          <div className="space-y-16 text-center px-6 relative">
            <div 
              className="glass-panel p-10 relative transition-all duration-300"
              style={{ 
                // 动态模糊和对比度，基于长按进度
                filter: `blur(${10 - revealProgress * 0.1}px) contrast(${1 + revealProgress * 0.01}) brightness(${0.5 + revealProgress * 0.005})`,
                transform: `scale(${0.95 + revealProgress * 0.0005})`
              }}
            >
              <div className="absolute -top-3 left-6 bg-white px-3 mono text-[8px] text-black tracking-widest uppercase font-bold">RAW_NEGATIVE</div>
              <p className="text-2xl font-extralight italic leading-relaxed text-white">“{activeSignal.refinedSignal}”</p>
              
              <div className="absolute left-2 top-0 bottom-0 w-2 flex flex-col justify-between py-2 pointer-events-none">
                 {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-3 bg-white/10 rounded-sm" />)}
              </div>
              <div className="absolute right-2 top-0 bottom-0 w-2 flex flex-col justify-between py-2 pointer-events-none">
                 {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-3 bg-white/10 rounded-sm" />)}
              </div>
            </div>
            
            <div className="space-y-6 flex flex-col items-center justify-center">
              <p className="mono text-[9px] text-white/30 uppercase tracking-[0.5em] animate-pulse">
                Hold_To_Develop_Signal
              </p>
              
              {/* 长按显影按钮 */}
              <button 
                onMouseDown={startReveal}
                onMouseUp={endReveal}
                onMouseLeave={endReveal}
                onTouchStart={startReveal}
                onTouchEnd={endReveal}
                onContextMenu={(e) => e.preventDefault()}
                className="relative w-24 h-24 rounded-full border border-white/20 flex items-center justify-center group overflow-hidden active:scale-95 transition-transform"
              >
                {/* 进度环背景 */}
                 <div 
                   className="absolute inset-0 bg-white/10 transition-all duration-75 ease-linear origin-bottom"
                   style={{ height: `${revealProgress}%` }}
                 />
                 
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className={`transition-all duration-300 ${revealProgress > 0 ? 'text-white scale-110' : 'text-white/40'}`}>
                   <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="currentColor" fillOpacity="0.2"/>
                   <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6Z" fill="currentColor"/>
                 </svg>

                 {/* 粒子装饰 */}
                 {revealProgress > 0 && (
                   <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 border border-white/50 rounded-full animate-ping" />
                   </div>
                 )}
              </button>
              
              <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-white transition-all duration-75 ease-linear" style={{ width: `${revealProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {stage === OnboardingStage.DASHBOARD && activeSignal && (
          <>
            {/* Interactive Data HUD Layer (Fixed Background) */}
            <DataHud />
          
            {/* Fixed Top Controls Layer - Increased Z-Index */}
            <div className="fixed top-0 left-0 right-0 z-[100] p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                {/* Restart/Reset Button (Pointer events enabled specifically) */}
                <button 
                  onClick={handleRestart} 
                  className="pointer-events-auto opacity-40 hover:opacity-100 transition-opacity p-2 group"
                  aria-label="Re-initialize"
                >
                  <div className="w-5 h-5 border border-white/30 rounded-sm flex items-center justify-center group-hover:border-white group-hover:bg-white/5">
                     <div className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-white" />
                  </div>
                </button>
                
                <span className="mono text-[10px] text-white/20 tracking-widest uppercase flicker-slow italic pointer-events-auto">
                  Signal_Link_{userName ? userName.toUpperCase() : 'A1'}
                </span>

                {/* Empty div to balance flex layout since Reset button is removed */}
                <div className="w-5"></div>
            </div>

            <div className="h-[100vh] overflow-y-auto no-scrollbar space-y-12 pb-32 px-2 pt-24 relative z-20">
              <div className="glass-panel p-10 relative shadow-2xl">
                <div className="absolute -top-3 left-8 bg-black px-3 mono text-[9px] text-white/40 tracking-[0.6em] uppercase">Core_Snapshot</div>
                <p className="text-3xl font-extralight italic leading-relaxed text-white">“{activeSignal.refinedSignal}”</p>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center mono text-[10px] text-white/20">
                    <span className="tracking-widest uppercase">ID: {activeSignal.id}</span>
                    <span className="tracking-widest uppercase">{activeSignal.durationDays}D Mission</span>
                </div>
              </div>

              <div className="glass-panel p-10 space-y-10 border-white/10 text-center">
                <div className="space-y-4">
                    <span className="mono text-[10px] text-white/30 uppercase tracking-[0.8em]">Daily_Resonance</span>
                    <h4 className="text-2xl font-extralight leading-relaxed text-white/90">“{dailyQuestion}”</h4>
                </div>
                <button 
                  disabled={hasDoneToday}
                  onClick={startObservation}
                  className={`w-full py-7 mono text-[12px] font-bold tracking-[1.5em] uppercase transition-all
                    ${hasDoneToday 
                      ? 'bg-neutral-900 text-white/20 border border-white/5 cursor-not-allowed' 
                      : 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95'}`}
                >
                  {hasDoneToday ? '今日已对齐' : '开始观测对齐'}
                </button>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest italic leading-loose">
                    {hasDoneToday ? '神经系统已锁定今日频率' : '训练你的 RAS 神经系统捕捉现实信号'}
                  </p>
                  <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                      <span className="mono text-[9px] text-white/60 uppercase tracking-widest">REMINDER:</span>
                      <input 
                        type="time" 
                        value={reminderTime} 
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="bg-transparent border-b border-white/20 text-white text-[10px] mono focus:outline-none w-16 text-center"
                      />
                  </div>
                </div>
              </div>

              <div className="space-y-8 px-2">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                    <h5 className="mono text-[11px] text-white/40 uppercase tracking-[0.6em] font-light">Resonance_Log</h5>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-light text-white">{activeSignal.observationHistory.length}</span>
                      <span className="mono text-[11px] text-white/30 uppercase tracking-tighter">/ {activeSignal.durationDays} days</span>
                    </div>
                </div>
                {renderCalendar()}
                <p className="text-[9px] text-neutral-800 uppercase tracking-[0.5em] text-center pt-2 italic">连续观测将增强信号强度</p>
              </div>

              <div className="space-y-10 px-2 pb-12">
                <div className="flex justify-between items-center">
                    <h5 className="mono text-[11px] text-white/40 uppercase tracking-[0.6em] italic">Reality_Echoes</h5>
                    <button onClick={() => setShowEchoModal(true)} className="text-[11px] border-b border-white/10 text-white/60 pb-1 tracking-widest">+ 记录回波</button>
                </div>
                {activeSignal.echos.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded-sm">
                      <p className="text-[10px] text-neutral-800 uppercase tracking-[0.8em] italic">等待回响出现...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                      {activeSignal.echos.map(echo => (
                        <div key={echo.id} className="p-8 glass-panel border-white/10">
                          <p className="text-xl font-extralight italic text-white/80 leading-relaxed">“{echo.content}”</p>
                          <div className="flex justify-between items-center mt-6">
                              <span className="mono text-[8px] text-white/10 uppercase tracking-widest">{new Date(echo.timestamp).toLocaleDateString()}</span>
                              <span className="mono text-[8px] text-white/30 tracking-widest uppercase">Captured</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 回波 Modal */}
      {showEchoModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 backdrop-blur-3xl bg-black/95 pointer-events-auto">
          <div className="w-full max-w-sm glass-panel p-12 space-y-10 animate-in zoom-in-95 duration-300 border-white/20">
            <div className="space-y-3 text-center">
              <h5 className="mono text-[11px] tracking-[0.8em] uppercase text-white/40">Sync_Archive</h5>
              <p className="text-[12px] text-neutral-600 italic tracking-wider">现实中发生了什么与信号一致的瞬间？</p>
            </div>
            <textarea 
              value={echoInput}
              onChange={(e) => setEchoInput(e.target.value)}
              placeholder="记录同步事件..."
              className="w-full bg-transparent border border-white/10 p-6 text-xl font-extralight focus:outline-none focus:border-white/30 h-48 resize-none text-white/80 leading-relaxed"
            />
            <div className="flex gap-6">
              <button onClick={() => setShowEchoModal(false)} className="flex-1 py-5 mono text-[11px] text-white/20 uppercase tracking-widest">Discard</button>
              <button 
                onClick={() => {
                  if (!activeSignal || !echoInput.trim()) return;
                  const updated = {
                    ...activeSignal,
                    echos: [{ id: Date.now().toString(), timestamp: Date.now(), content: echoInput }, ...activeSignal.echos]
                  };
                  setActiveSignal(updated);
                  localStorage.setItem('FLOW_STATE_SIGNAL_V7', JSON.stringify(updated));
                  setEchoInput('');
                  setShowEchoModal(false);
                }} 
                className="flex-1 py-5 bg-white text-black mono text-[12px] uppercase font-bold tracking-[1em]"
              >归档</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-[-1]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
    </div>
  );
};

export default App;
