
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
        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
           <p className="text-xs font-bold text-gray-400 uppercase ml-2">Membros da Equipa</p>
           {users.map(user => (
             <button
               key={user.id}
               onClick={() => onSwitchUser(user.id)}
               disabled={user.id === currentUser.id}
               className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                 user.id === currentUser.id 
                   ? 'bg-gray-50 dark:bg-neutral-800 border-transparent opacity-50 cursor-default' 
                   : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-700 hover:border-agro-green active:scale-95'
               }`}
             >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                   user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                   {user.avatar}
                </div>
                <div className="flex-1 text-left">
                   <h5 className="font-bold text-gray-800 dark:text-white text-sm">{user.name}</h5>
                   <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-bold">
                      {user.role === 'admin' ? <Shield size={10} /> : <Briefcase size={10} />}
                      {user.role === 'admin' ? 'Admin' : user.specialty || 'Operador'}
                   </div>
                </div>
                {user.id !== currentUser.id && (
                   <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full text-gray-400">
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