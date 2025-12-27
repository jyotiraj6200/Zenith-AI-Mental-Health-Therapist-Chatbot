import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getChatMessageResponse,
  analyzeForDistress,
  analyzeTextSentiment,
  analyzeFacialEmotion,
  generateSpeech
} from '../../services/geminiService';
import { saveChatSession, getLastChatSession } from '../../services/chatHistoryService';
import {
  PaperAirplaneIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import { useVoiceControl } from '../../contexts/VoiceControlContext';
import RealtimeFeatures from './RealtimeFeatures';
import { playBase64Audio } from '../../utils/audioUtils';
import type { Message, Emotion, ChatSession } from '../../types';

const MAX_CHAT_LENGTH = 2000;

const emotionMap: Record<Emotion, string> = {
  Happy: '😊',
  Sad: '😔',
  Angry: '😠',
  Surprised: '😮',
  Neutral: '🤔',
  Fearful: '😨',
  Disgusted: '🤢',
  Unknown: '💬'
};

export const ChatView: React.FC<any> = ({
  user,
  settings,
  initialMessages,
  onNewChat,
  liveLocation,
  onActivateEmergencyMode
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const {
    isConversationModeActive,
    toggleConversationMode,
    dictationResult,
    isUserSpeaking,
    setTTSStatus
  } = useVoiceControl();

  /* Init AudioContext */
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }, []);

  /* Auto resize textarea */
  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(
      inputRef.current.scrollHeight,
      200
    )}px`;
  }, [text]);

  /* Voice dictation → text */
  useEffect(() => {
    if (isConversationModeActive) {
      setText(dictationResult);
    }
  }, [dictationResult, isConversationModeActive]);

  /* Load last chat */
  useEffect(() => {
    if (initialMessages?.length) {
      setMessages(initialMessages);
    } else {
      const last = getLastChatSession(user.email);
      if (last) {
        setMessages(last.messages);
        setSession(last);
      }
    }
  }, [initialMessages, user.email]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text,
        timestamp: new Date()
      };

      setMessages(m => [...m, userMsg]);
      setText('');

      const distress = await analyzeForDistress(text);
      if (distress === 'ALERT') {
        onActivateEmergencyMode();
        return;
      }

      const baseSession: ChatSession =
        session ?? {
          id: `s_${Date.now()}`,
          title: text.slice(0, 25),
          messages: [],
          startTime: new Date(),
          lastMessageTime: new Date()
        };

      const history = [...baseSession.messages, userMsg];

      const res = await getChatMessageResponse(text, history, {
        language: settings.language,
        location: liveLocation
      });

      const modelMsg: Message = {
        id: Date.now() + '_m',
        sender: 'model',
        text: res.text,
        timestamp: new Date(),
        emotion: await analyzeTextSentiment(res.text)
      };

      setMessages(m => [...m, modelMsg]);

      const updatedSession: ChatSession = {
        ...baseSession,
        messages: [...history, modelMsg],
        lastMessageTime: new Date()
      };

      setSession(updatedSession);
      saveChatSession(user.email, updatedSession);

      if (isConversationModeActive && audioRef.current) {
        const audio = await generateSpeech(modelMsg.text);
        if (audio) {
          playBase64Audio(
            audio,
            audioRef.current,
            () => setTTSStatus(true),
            () => setTTSStatus(false)
          );
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between border-b">
          <h2 className="font-bold">ZAIC</h2>
          <div className="flex gap-2">
            <PlusCircleIcon onClick={onNewChat} className="w-6 cursor-pointer" />
            <Cog6ToothIcon className="w-6 cursor-pointer" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map(m => (
            <div
              key={m.id}
              className={`mb-3 ${m.sender === 'user' ? 'text-right' : ''}`}
            >
              <div className="inline-block p-3 rounded-lg bg-white dark:bg-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.text}
                </ReactMarkdown>
                {m.emotion && <span>{emotionMap[m.emotion]}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 flex gap-2 border-t">
          <textarea
            ref={inputRef}
            value={text}
            disabled={isConversationModeActive}
            onChange={e => setText(e.target.value)}
            onKeyDown={e =>
              e.key === 'Enter' && !e.shiftKey && sendMessage()
            }
            className="flex-1 resize-none p-2 rounded"
            maxLength={MAX_CHAT_LENGTH}
          />
          <button onClick={sendMessage} disabled={sending}>
            <PaperAirplaneIcon className="w-6" />
          </button>
          <button onClick={toggleConversationMode}>
            <MicrophoneIcon
              className={`w-6 ${isUserSpeaking ? 'text-red-500' : ''}`}
            />
          </button>
        </div>
      </div>

      <RealtimeFeatures
        analyzeFacialEmotion={analyzeFacialEmotion}
        liveLocation={liveLocation}
      />
    </div>
  );
};
