
import React, { useState } from 'react';
import { User, Shield, CheckCircle, UserPlus, X, LogOut, Briefcase } from 'lucide-react';
import { UserProfile } from '../types';

interface TeamManagerProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onSwitchUser: (userId: string) => void;
  onClose: () => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ users, currentUser, onSwitchUser, onClose }) => {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-scale-up border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black dark:text-white">A Minha Equipa</h3>
            <p className="text-xs text-gray-500 font-bold uppercase">Gestão & Perfis</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        {/* Current User Card */}
        <div className="bg-agro-green/10 border border-agro-green rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-agro-green text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md">
            {currentUser.avatar}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-agro-green uppercase tracking-wider mb-0.5">Sessão Atual</p>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-none">{currentUser.name}</h4>
            <p className="text-xs text-gray-500 capitalize">{currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</p>
          </div>
          <div className="bg-green-500 p-1.5 rounded-full text-white">
            <CheckCircle size={14} />
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          <p className="text-xs font-bold text-gray-400 uppercase ml-2">Monitorização em Tempo Real</p>
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => onSwitchUser(user.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${user.id === currentUser.id
                ? 'bg-agro-green/5 border-agro-green/20'
                : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-700 hover:border-indigo-400 active:scale-95'
                }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                  {user.avatar}
                </div>
                {/* Safety Status Badge */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 ${user.safetyStatus?.status === 'emergency' ? 'bg-red-500 animate-ping' :
                  user.safetyStatus?.status === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
              </div>

              <div className="flex-1 text-left">
                <h5 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                  {user.name}
                  {user.id === currentUser.id && <span className="text-[8px] bg-agro-green text-white px-1.5 py-0.5 rounded font-black">EU</span>}
                </h5>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2 text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                    <span className={`flex items-center gap-1 ${user.safetyStatus?.status === 'emergency' ? 'text-red-500' : ''}`}>
                      {user.safetyStatus?.status === 'emergency' ? 'ALERTA MAN DOWN' : user.role === 'admin' ? 'Administrador' : user.specialty || 'Operador'}
                    </span>
                    {user.safetyStatus?.batteryLevel !== undefined && (
                      <span className={`flex items-center gap-1 ${user.safetyStatus.batteryLevel < 20 ? 'text-red-500' : 'text-gray-400'}`}>
                        • {(user.safetyStatus.batteryLevel)}% Bat.
                      </span>
                    )}
                  </div>
                  <p className="text-[8px] text-gray-400 font-medium">
                    Último sinal: {new Date(user.safetyStatus?.lastMovement || '').toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {user.id !== currentUser.id && (
                <div className="p-2 bg-gray-50 dark:bg-neutral-800 rounded-full text-gray-400 transition-colors group-hover:text-indigo-500">
                  <LogOut size={14} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Invite Section */}
        {showInvite ? (
          <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-2xl animate-slide-up text-center border border-dashed border-gray-300 dark:border-neutral-700">
            <p className="text-xs font-bold text-gray-500 mb-2">Código de Convite</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-widest mb-2 select-all">ORIVA-2024</p>
            <p className="text-[10px] text-gray-400">Partilhe este código com o novo membro.</p>
            <button
              onClick={() => setShowInvite(false)}
              className="mt-3 text-xs font-bold text-red-500 hover:underline"
            >
              Fechar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInvite(true)}
            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <UserPlus size={18} />
            Adicionar Membro
          </button>
        )}

      </div>
    </div>
  );
};

export default TeamManager;