import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, X, Activity, Command, Check, AlertCircle, Sparkles } from 'lucide-react';

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

  // --- 2. Processamento de Comandos (NLP Simples) ---
  const processTranscript = useCallback((text: string) => {
    if (!text) return;
    
    setStatus('processing');
    const lowerText = text.toLowerCase();
    let action: VoiceActionType | null = null;
    let successMsg = '';

    // --- Lógica de Mapeamento ---
    
    // Navegação
    if (lowerText.includes('início') || lowerText.includes('dashboard') || lowerText.includes('casa')) {
      action = { type: 'NAVIGATE', target: 'dashboard' };
      successMsg = 'A abrir o Dashboard';
    } else if (lowerText.includes('animal') || lowerText.includes('animais') || lowerText.includes('vacas')) {
      action = { type: 'NAVIGATE', target: 'animal' };
      successMsg = 'A ir para Animais';
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
      successMsg = 'Nova Tarefa criada';
    } else if (lowerText.includes('novo animal') || lowerText.includes('registar animal')) {
      action = { type: 'OPEN_MODAL', target: 'new_animal' };
      successMsg = 'Registo de Animal aberto';
    }
    
    // IoT Control
    else if (lowerText.includes('ligar') && (lowerText.includes('rega') || lowerText.includes('água'))) {
      action = { type: 'IOT_CONTROL', action: 'irrigation_on' };
      successMsg = 'A ligar sistema de rega...';
    } else if (lowerText.includes('desligar') && (lowerText.includes('rega') || lowerText.includes('água'))) {
      action = { type: 'IOT_CONTROL', action: 'irrigation_off' };
      successMsg = 'A desligar sistema de rega...';
    } else if (lowerText.includes('parar tudo') || lowerText.includes('emergência')) {
      action = { type: 'IOT_CONTROL', action: 'stop_all' };
      successMsg = 'Paragem de emergência acionada!';
    }

    // --- Execução ---
    if (action) {
      setTimeout(() => {
        onCommand(action!);
        setStatus('success');
        setFeedbackMsg(successMsg);
        setTimeout(() => setStatus('idle'), 2500);
      }, 600); // Pequeno delay para UX "pensando"
    } else {
      setStatus('error');
      setFeedbackMsg('Comando não reconhecido.');
      setTimeout(() => setStatus('idle'), 2500);
    }

  }, [onCommand]);

  // Trigger processamento quando a escuta para
  useEffect(() => {
    if (!isListening && transcript && status !== 'error' && status !== 'success') {
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
        className={`fixed bottom-28 right-4 z-[150] w-10 h-11 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
          isListening 
            ? 'bg-red-500 scale-110 animate-pulse' 
            : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:brightness-110'
        }`}
      >
        {isListening ? (
          <Activity className="text-white animate-pulse" />
        ) : (
          <Mic className="text-white" />
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
                  <div className={`p-2 rounded-full ${
                    status === 'listening' ? 'bg-blue-100 text-blue-600' :
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
                    <p className={`font-bold text-lg ${
                       status === 'error' ? 'text-red-500' : 
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
                  {['Ir para Stock', 'Nova Tarefa', 'Ligar Rega', 'Novo Animal'].map(cmd => (
                    <span key={cmd} className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-gray-500 whitespace-nowrap border border-gray-200 dark:border-neutral-700">
                      "{cmd}"
                    </span>
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