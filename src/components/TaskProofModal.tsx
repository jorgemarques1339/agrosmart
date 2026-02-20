
import React, { useState } from 'react';
import { Camera, Check, X, Image as ImageIcon, ThumbsUp, ThumbsDown, Loader2, MapPin } from 'lucide-react';
import { Task, UserProfile } from '../types';
import { useStore } from '../store/useStore';

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
  const { permissions, setPermission } = useStore();
  const [photo, setPhoto] = useState<string | null>(task.proofImage || null);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [feedback, setFeedback] = useState('');

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Initialize Camera
  React.useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen && currentUser.role !== 'admin' && !photo) {
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setPermission('camera', true);
          }
        } catch (err) {
          console.error("Camera error:", err);
          setPermission('camera', false);
        }
      };

      startCamera();

      // Get GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setPermission('gps', false)
        );
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, photo, currentUser.role]);

  if (!isOpen) return null;

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setPhoto(canvas.toDataURL('image/jpeg'));
      }
    }
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

        <div className="aspect-[3/4] bg-black rounded-3xl overflow-hidden mb-6 relative shadow-lg group cursor-pointer" onClick={photo ? () => setPhoto(null) : handleTakePhoto}>
          {photo ? (
            <>
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-bold flex items-center gap-2"><Camera size={20} /> Tocar para Repetir</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-center text-white/50 pointer-events-none">
                <Camera size={48} className="mb-2" />
                <span className="text-sm font-bold uppercase tracking-widest">Tocar para Fotografar</span>
              </div>
            </div>
          )}

          {/* Camera UI Overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {coords && <div className="p-2 bg-emerald-500 rounded-full shadow-lg"><MapPin size={12} className="text-white" /></div>}
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="bg-black/50 px-3 py-1 rounded-full text-[10px] text-white font-mono uppercase backdrop-blur-md border border-white/10">
              {new Date().toLocaleTimeString()} {coords ? `• GPS ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '• GPS Ativo'}
            </span>
          </div>
        </div>

        <button
          onClick={handleOperatorSubmit}
          disabled={!photo}
          className={`w-full py-4 rounded-[1.5rem] font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all ${!photo ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 cursor-not-allowed' : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
            }`}
        >
          <Check size={20} /> Enviar para Aprovação
        </button>
      </div>
    </div>
  );
};

export default TaskProofModal;