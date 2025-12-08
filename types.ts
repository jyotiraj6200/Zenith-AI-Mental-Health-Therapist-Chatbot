export type Emotion = 'Happy' | 'Sad' | 'Angry' | 'Surprised' | 'Neutral' | 'Fearful' | 'Disgusted' | 'Unknown';

export interface EmotionConfidence {
  emotion: Emotion;
  confidence: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}



export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'model';
  timestamp: Date;
  emotion?: Emotion;
  groundingMetadata?: any[];
}



export type Mood = 'Happy' | 'Content' | 'Neutral' | 'Sad' | 'Anxious';

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: Mood;
  note?: string;
}