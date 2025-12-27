
export enum OnboardingStage {
  INTRO_1 = 'INTRO_1',
  CALIBRATION = 'CALIBRATION', // 新增：生理校准阶段
  NAME_INPUT = 'NAME_INPUT',
  INTRO_2 = 'INTRO_2',
  TUNING = 'TUNING',
  LOCKED = 'LOCKED',
  DEFINITION = 'DEFINITION',
  GUIDED_INPUT = 'GUIDED_INPUT',
  EMISSION = 'EMISSION',      
  STABLE = 'STABLE',          
  DASHBOARD = 'DASHBOARD',
  OBSERVING = 'OBSERVING'
}

export interface EchoRecord {
  id: string;
  timestamp: number;
  content: string;
}

export interface ManifestSignal {
  id: string;
  userName: string;
  targetGoal: string;
  durationDays: number;
  refinedSignal: string;
  createdAt: number;
  manifestCount: number;
  streak: number;
  lastObservedAt?: number;
  observationHistory: string[]; // 存储 YYYY-MM-DD 格式的打卡日期
  echos: EchoRecord[];
  progress: number;
  ambientParams?: AmbientParams; // 新增：环境音参数
}

export interface AmbientParams {
  type: 'white' | 'pink' | 'brown';
  filterFreq: number;
  modulation: boolean;
}
