import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, X, Activity, Command, Check, AlertCircle, Sparkles, BrainCircuit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { processOrivaInsight } from '../services/orivaInsight';

// Tipos para as ações que a App suporta via voz
export type VoiceActionType =
  | { type: 'NAVIGATE'; target: 'dashboard' | 'animal' | 'cultivation' | 'stocks' | 'machines' | 'finance' }
  | { type: 'OPEN_MODAL'; target: 'new_task' | 'new_animal' | 'new_machine' | 'add_stock' }
  | { type: 'IOT_CONTROL'; action: 'irrigation_on' | 'irrigation_off' | 'stop_all' }
  | { type: 'ERROR'; message: string };

interface VoiceAssistantProps {
  onCommand: (action: VoiceActionType) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const recognitionRef = useRef<any>(null);

  // --- 1. Inicialização da API Web Speech ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false; // Comando único para maior precisão
      recognition.interimResults = true;
      recognition.lang = 'pt-PT'; // Português de Portugal

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
        setFeedbackMsg('Estou a ouvir...');
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimTranscript += event.results[i][0].transcript;
        }
        setTranscript(interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        // O processamento real acontece no useEffect que observa o 'transcript' final ou aqui se for final
      };

      recognition.onerror = (event: any) => {
        console.error("Erro voz:", event.error);
        setStatus('error');
        setFeedbackMsg('Não percebi. Tente novamente.');
        setIsListening(false);
        setTimeout(() => setStatus('idle'), 3000);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const store = useStore();

  const speakAnswer = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // --- 2. Processamento de Comandos (NLP + Oriva Insight) ---
  const processTranscript = useCallback((text: string) => {
    if (!text) return;

    setStatus('processing');
    const lowerText = text.toLowerCase();

    // PRIORITY 1: Data Insights (The "Heart" of Oriva Insight)
    const insight = processOrivaInsight(text, store);

    if (insight) {
      setTimeout(() => {
        setStatus('success');
        setFeedbackMsg(insight.answer);
        speakAnswer(insight.answer);
        setTranscript(''); // LIMPAR TRANSCRIPT PARA EVITAR LOOP

        if (insight.action) {
          setTimeout(() => {
            onCommand(insight.action as VoiceActionType);
          }, 2000);
        }

        setTimeout(() => setStatus('idle'), 6000);
      }, 800);
      return;
    }

    // PRIORITY 2: Simple Navigation / Command Mappings (Legacy)
    let action: VoiceActionType | null = null;
    let successMsg = '';

    // Navegação
    if (lowerText.includes('início') || lowerText.includes('dashboard') || lowerText.includes('casa')) {
      action = { type: 'NAVIGATE', target: 'dashboard' };
      successMsg = 'A abrir o Dashboard';
    } else if (lowerText.includes('animal') || lowerText.includes('animais') || lowerText.includes('vacas') || lowerText.includes('lote')) {
      action = { type: 'NAVIGATE', target: 'animal' };
      successMsg = 'A abrir a secção de Animais';
    } else if (lowerText.includes('cultivo') || lowerText.includes('campos') || lowerText.includes('terrenos')) {
      action = { type: 'NAVIGATE', target: 'cultivation' };
      successMsg = 'A abrir Cultivos';
    } else if (lowerText.includes('stock') || lowerText.includes('armazém') || lowerText.includes('produtos')) {
      action = { type: 'NAVIGATE', target: 'stocks' };
      successMsg = 'A abrir Stock';
    } else if (lowerText.includes('máquina') || lowerText.includes('frota') || lowerText.includes('trator')) {
      action = { type: 'NAVIGATE', target: 'machines' };
      successMsg = 'A abrir Frota';
    } else if (lowerText.includes('finança') || lowerText.includes('contas') || lowerText.includes('dinheiro')) {
      action = { type: 'NAVIGATE', target: 'finance' };
      successMsg = 'A abrir Finanças';
    }

    // Ações Rápidas (Modais)
    else if (lowerText.includes('tarefa') || lowerText.includes('atividade')) {
      action = { type: 'OPEN_MODAL', target: 'new_task' };
      successMsg = 'A abrir criação de tarefa';
    } else if (lowerText.includes('registar animal')) {
      action = { type: 'OPEN_MODAL', target: 'new_animal' };
      successMsg = 'A abrir registo de animal';
    }

    // IoT Control
    else if (lowerText.includes('ligar') && (lowerText.includes('rega') || lowerText.includes('água'))) {
      action = { type: 'IOT_CONTROL', action: 'irrigation_on' };
      successMsg = 'Comando enviado: Ligar Rega';
    } else if (lowerText.includes('desligar') && (lowerText.includes('rega') || lowerText.includes('água'))) {
      action = { type: 'IOT_CONTROL', action: 'irrigation_off' };
      successMsg = 'Comando enviado: Desligar Rega';
    }

    if (action) {
      setTimeout(() => {
        onCommand(action!);
        setStatus('success');
        setFeedbackMsg(successMsg);
        speakAnswer(successMsg);
        setTranscript(''); // LIMPAR TRANSCRIPT PARA EVITAR LOOP
        setTimeout(() => setStatus('idle'), 2500);
      }, 600);
    } else {
      setStatus('error');
      setFeedbackMsg('Não consegui processar esse pedido. Tenta perguntar sobre custos, stock ou animais.');
      speakAnswer('Não percebi. Tenta perguntar sobre custos, stock ou animais.');
      setTranscript(''); // LIMPAR TRANSCRIPT PARA EVITAR LOOP
      setTimeout(() => setStatus('idle'), 3000);
    }

  }, [onCommand, store]);

  // Trigger processamento quando a escuta para
  useEffect(() => {
    if (!isListening && transcript && status !== 'error' && status !== 'success' && status !== 'processing') {
      processTranscript(transcript);
    }
  }, [isListening, transcript, processTranscript, status]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already started");
      }
    }
  };

  if (!isSupported) return null;

  return (
    <>
      {/* 1. FAB (Floating Action Button) - Sempre visível */}
      <button
        onClick={toggleListening}
        className={`fixed bottom-28 right-4 z-[150] w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border-2 ${isListening
          ? 'bg-red-500 border-white scale-110 animate-pulse'
          : 'bg-black dark:bg-white text-white dark:text-black border-transparent hover:rotate-12'
          }`}
      >
        {isListening ? (
          <Activity className="animate-pulse" />
        ) : (
          <BrainCircuit />
        )}
      </button>

      {/* 2. OVERLAY DE ESCUTA (Estilo Siri/Assistant) */}
      {status !== 'idle' && (
        <div className="fixed inset-x-0 bottom-0 z-[160] flex flex-col items-center justify-end pointer-events-none">

          {/* Backdrop Blur Area */}
          <div className="w-full max-w-lg mx-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-white/20 p-6 pb-8 transition-all animate-slide-up pointer-events-auto">

            {/* Header / Status Icon */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${status === 'listening' ? 'bg-blue-100 text-blue-600' :
                  status === 'processing' ? 'bg-yellow-100 text-yellow-600' :
                    status === 'success' ? 'bg-green-100 text-green-600' :
                      'bg-red-100 text-red-600'
                  }`}>
                  {status === 'listening' && <Mic size={20} />}
                  {status === 'processing' && <Sparkles size={20} className="animate-spin-slow" />}
                  {status === 'success' && <Check size={20} />}
                  {status === 'error' && <AlertCircle size={20} />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Oriva Assistant</p>
                  <p className={`font-bold text-lg ${status === 'error' ? 'text-red-500' :
                    status === 'success' ? 'text-green-600' :
                      'text-gray-900 dark:text-white'
                    }`}>
                    {status === 'listening' ? 'A ouvir...' : feedbackMsg || 'A processar...'}
                  </p>
                </div>
              </div>

              <button onClick={() => { recognitionRef.current?.stop(); setStatus('idle'); }} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* Transcription Display */}
            {transcript && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700">
                <p className="text-xl font-medium text-gray-600 dark:text-gray-300 italic">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Audio Visualizer Animation */}
            {status === 'listening' && (
              <div className="flex items-center justify-center gap-1.5 h-12 mb-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-gradient-to-t from-emerald-500 to-green-300 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDuration: `${0.4 + Math.random() * 0.5}s`
                    }}
                  ></div>
                ))}
              </div>
            )}

            {/* Suggestions Chips */}
            {status === 'listening' && !transcript && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {[
                  'Quanto gastei este mês?',
                  'Animais com baixo peso?',
                  'O que falta no stock?',
                  'Estado do trator',
                  'Tarefas pendentes'
                ].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => { setTranscript(cmd); processTranscript(cmd); }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap border border-gray-200 dark:border-neutral-700 hover:bg-agro-green hover:text-white transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;