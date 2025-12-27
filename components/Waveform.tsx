
import React from 'react';

interface WaveformProps {
  progress: number;
  isLocked: boolean;
  isActive: boolean;
  intensity: number; // 0-1 接近目标的程度
}

export const Waveform: React.FC<WaveformProps> = ({ progress, isLocked, isActive, intensity }) => {
  if (!isActive) return null;

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* 核心谐振腔 */}
      <div 
        className={`relative z-10 rounded-full transition-all duration-300 ease-out border ${isLocked ? 'bg-white scale-110 shadow-[0_0_80px_rgba(255,255,255,1)]' : 'bg-transparent'}`}
        style={{
          width: isLocked ? '8px' : `${10 + intensity * 20}px`,
          height: isLocked ? '8px' : `${10 + intensity * 20}px`,
          borderColor: `rgba(255,255,255, ${0.2 + intensity * 0.8})`,
          boxShadow: `0 0 ${intensity * 40}px rgba(255,255,255, ${intensity * 0.5})`
        }}
      >
        {isLocked && <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />}
      </div>
      
      {/* 动态同步环 */}
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="absolute border rounded-full transition-all duration-500"
          style={{
            width: `${40 + i * 40 + (1 - intensity) * 60}%`,
            height: `${40 + i * 40 + (1 - intensity) * 60}%`,
            borderColor: `rgba(255,255,255, ${0.05 + intensity * 0.15})`,
            transform: `rotate(${progress + i * 45}deg) scale(${1 + (1 - intensity) * 0.2})`,
            borderStyle: i % 2 === 0 ? 'solid' : 'dashed',
            borderWidth: '1px'
          }}
        />
      ))}

      {/* 干扰粒子 */}
      {!isLocked && [...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute w-[2px] h-[2px] bg-white transition-all duration-700"
          style={{
            top: `${50 + (Math.random() - 0.5) * (200 * (1 - intensity))}%`,
            left: `${50 + (Math.random() - 0.5) * (200 * (1 - intensity))}%`,
            opacity: 0.1 + (1 - intensity) * 0.3,
            filter: `blur(${1 - intensity}px)`
          }}
        />
      )}

      {/* 锁定进度文字 */}
      {!isLocked && progress > 0 && (
        <div className="absolute bottom-[-40px] mono text-[10px] text-white/40 tracking-[0.5em] uppercase">
          SYNC_LOCK: {progress.toFixed(0)}%
        </div>
      )}
    </div>
  );
};
