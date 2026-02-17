
import React, { useState } from 'react';
import { Camera, Check, X, Image as ImageIcon, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Task, UserProfile } from '../types';

interface TaskProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  currentUser: UserProfile;
  onSubmitProof: (taskId: string, image: string) => void;
  onReviewTask: (taskId: string, approved: boolean, feedback?: string) => void;
}

const TaskProofModal: React.FC<TaskProofModalProps> = ({ 
  isOpen, onClose, task, currentUser, onSubmitProof, onReviewTask 
}) => {
  const [photo, setPhoto] = useState<string | null>(task.proofImage || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  // MOCK CAMERA: Em vez de usar navigator.mediaDevices (complexo), simulamos o take photo
  const handleTakePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
      // Mock Image (Trator/Campo)
      setPhoto("https://images.unsplash.com/photo-1625246333195-58f21460d8a6?q=80&w=1000&auto=format&fit=crop");
      setIsCapturing(false);
    }, 1500);
  };

  const handleOperatorSubmit = () => {
    if (photo) {
      onSubmitProof(task.id, photo);
      onClose();
    }
  };

  const handleAdminAction = (approved: boolean) => {
    onReviewTask(task.id, approved, feedback);
    onClose();
  };

  // RENDER: ADMIN VIEW (Validation)
  if (currentUser.role === 'admin' && task.status === 'review') {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
        <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-scale-up border border-white/20" onClick={e => e.stopPropagation()}>
           <h3 className="text-xl font-black dark:text-white mb-2">Validar Tarefa</h3>
           <p className="text-sm text-gray-500 mb-4">{task.title}</p>

           <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden mb-4 border-4 border-gray-100 dark:border-neutral-800 shadow-inner relative">
              {task.proofImage ? (
                <img src={task.proofImage} alt="Prova" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                   <ImageIcon size={40} />
                   <span className="text-xs font-bold mt-2">Sem Imagem</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold">
                 Enviado por Operador
              </div>
           </div>

           <input 
             value={feedback}
             onChange={(e) => setFeedback(e.target.value)}
             placeholder="Feedback (Opcional se rejeitar)"
             className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl text-sm font-bold outline-none mb-4"
           />

           <div className="flex gap-3">
              <button 
                onClick={() => handleAdminAction(false)}
                className="flex-1 py-4 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                 <ThumbsDown size={18} /> Rejeitar
              </button>
              <button 
                onClick={() => handleAdminAction(true)}
                className="flex-1 py-4 bg-agro-green text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
              >
                 <ThumbsUp size={18} /> Aprovar
              </button>
           </div>
        </div>
      </div>
    );
  }

  // RENDER: OPERATOR VIEW (Proof Submission)
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-scale-up border border-white/20" onClick={e => e.stopPropagation()}>
         <div className="flex justify-between items-center mb-6">
            <div>
               <h3 className="text-xl font-black dark:text-white">Prova de Execução</h3>
               <p className="text-xs text-gray-500 font-bold uppercase">{task.title}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
               <X size={20} className="dark:text-white" />
            </button>
         </div>

         {/* Camera Viewfinder */}
         <div className="aspect-[3/4] bg-black rounded-3xl overflow-hidden mb-6 relative shadow-lg group cursor-pointer" onClick={handleTakePhoto}>
            {photo ? (
               <>
                 <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold flex items-center gap-2"><Camera size={20} /> Tocar para Repetir</span>
                 </div>
               </>
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                  {isCapturing ? <Loader2 size={48} className="animate-spin text-agro-green" /> : <Camera size={48} />}
                  {!isCapturing && <span className="text-sm font-bold mt-2 uppercase tracking-widest">Tocar para Fotografar</span>}
               </div>
            )}
            
            {/* Camera UI Overlay */}
            <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
               <span className="bg-black/50 px-3 py-1 rounded-full text-[10px] text-white font-mono uppercase backdrop-blur-md">
                  {new Date().toLocaleTimeString()} • GPS Ativo
               </span>
            </div>
         </div>

         <button 
           onClick={handleOperatorSubmit}
           disabled={!photo}
           className={`w-full py-4 rounded-[1.5rem] font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all ${
             !photo ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 cursor-not-allowed' : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
           }`}
         >
            <Check size={20} /> Enviar para Aprovação
         </button>
      </div>
    </div>
  );
};

export default TaskProofModal;