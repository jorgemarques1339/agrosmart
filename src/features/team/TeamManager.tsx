
import React, { useState } from 'react';
import {
  User, Shield, CheckCircle, UserPlus, X, LogOut,
  Trash2, Mail, BadgeCheck, Users, Briefcase,
  Stethoscope, Settings as SettingsIcon, Wrench, Sprout,
  ArrowRight, Activity, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile } from '../../types';
import { MicroLabel } from '../../components/ui/MicroLabel';
import { haptics } from '../../utils/haptics';

interface TeamManagerProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onAddUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (userId: string) => void;
  onClose: () => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ users, currentUser, onAddUser, onDeleteUser, onSwitchUser, onClose }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserProfile['role']>('farmer');
  const [showQRUser, setShowQRUser] = useState<UserProfile | null>(null);
  const [showClockInQR, setShowClockInQR] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const roleConfig = {
    admin: { label: 'Administrador', icon: Shield, color: 'text-slate-600 bg-slate-100', dot: 'bg-slate-500' },
    farmer: { label: 'Agricultor', icon: Sprout, color: 'text-emerald-600 bg-emerald-100', dot: 'bg-emerald-500' },
    vet: { label: 'Veterinário(a)', icon: Stethoscope, color: 'text-purple-600 bg-purple-100', dot: 'bg-purple-500' },
    mechanic: { label: 'Mecânico', icon: Wrench, color: 'text-blue-600 bg-blue-100', dot: 'bg-blue-500' },
    operator: { label: 'Operador', icon: Briefcase, color: 'text-orange-600 bg-orange-100', dot: 'bg-orange-500' },
  };

  const handleCreate = () => {
    if (!newName) return;
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: newName,
      role: newRole,
      avatar: newName.charAt(0).toUpperCase(),
      safetyStatus: {
        status: 'safe',
        lastMovement: new Date().toISOString(),
        batteryLevel: 100
      }
    };
    onAddUser(newUser);
    setNewName('');
    setShowAddForm(false);
    haptics.success();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div
        className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full max-w-md rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl animate-scale-up border border-white/20 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
          <div>
            <h3 className="text-2xl font-black dark:text-white flex items-center gap-2">
              <Users className="text-emerald-500" /> Gestão da Equipa
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Controlo de Acessos & Perfis</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-full active:scale-90 transition-transform">
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

          {/* Admin Tools: Add Section */}
          {isAdmin && !showAddForm && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 px-6 bg-emerald-500 text-white rounded-[1.5rem] font-black text-sm flex items-center justify-between shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <UserPlus size={20} />
                  Adicionar Novo Membro
                </div>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setShowClockInQR(true)}
                className="w-full py-4 px-6 bg-white dark:bg-neutral-900 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-[1.5rem] font-black text-sm flex items-center justify-between shadow-lg shadow-emerald-500/5 active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <QrCode size={20} />
                  Portal Trabalhadores Sazonais (Tarefeiros)
                </div>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Add Form (Visible only to Admin when active) */}
          {showAddForm && (
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 border border-emerald-100 dark:border-emerald-900/30 shadow-xl animate-slide-up space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-sm uppercase text-emerald-600 dark:text-emerald-400">Novo Utilizador</h4>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400"><X size={16} /></button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <MicroLabel as="label" className="text-gray-400 ml-2">Nome Completo</MicroLabel>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="ex: João Silva"
                    className="w-full p-4 bg-gray-50 dark:bg-[#151515] rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <MicroLabel as="label" className="text-gray-400 ml-2">Perfil de Acesso (Role)</MicroLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map(role => {
                      const config = roleConfig[role];
                      return (
                        <button
                          key={role}
                          onClick={() => setNewRole(role as any)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${newRole === role
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600'
                            : 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-white/5 text-gray-400 hover:border-gray-200'
                            }`}
                        >
                          <config.icon size={18} />
                          <span className="text-[9px] font-black uppercase">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!newName}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <BadgeCheck size={18} /> Criar Acesso Instantâneo
                </button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-4">
            <MicroLabel as="h4" className="text-gray-400 ml-2 flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> Membros da Equipa ({users.length})
            </MicroLabel>

            <div className="grid gap-3">
              {users.map(user => {
                const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.operator;
                const isMe = user.id === currentUser.id;

                return (
                  <div
                    key={user.id}
                    className={`group relative p-4 rounded-3xl border transition-all flex items-center gap-4 ${isMe ? 'bg-emerald-50/30 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-900/20' : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-white/5'
                      }`}
                  >
                    {/* Avatar with Status */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner ${config.color}`}>
                        {user.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-lg border-2 border-white dark:border-neutral-900 ${user.safetyStatus?.status === 'emergency' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                        }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </h5>
                        {isMe && <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">VOCÊ</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        <MicroLabel className="text-gray-400 tracking-tighter">
                          {config.label}
                        </MicroLabel>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isMe && (
                        <button
                          onClick={() => { haptics.medium(); onSwitchUser(user.id); }}
                          className="p-2.5 rounded-2xl bg-gray-50 dark:bg-neutral-800 text-gray-400 hover:text-emerald-500 transition-colors"
                          title="Simular sessão"
                        >
                          <LogOut size={16} />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => { haptics.light(); setShowQRUser(user); }}
                          className="p-2.5 rounded-2xl bg-gray-50 dark:bg-neutral-800 text-gray-400 hover:text-indigo-500 transition-colors"
                          title="Gerar QR de Acesso"
                        >
                          <QrCode size={16} />
                        </button>
                      )}

                      {isAdmin && !isMe && (
                        <button
                          onClick={() => { haptics.warning(); onDeleteUser(user.id); }}
                          className="p-2.5 rounded-2xl bg-gray-50 dark:bg-red-900/10 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-gray-50 dark:bg-neutral-800/50 text-center border-t border-gray-100 dark:border-white/5">
          <p className="text-[10px] text-gray-400 font-medium">
            Protocolo de Segurança Oriva-Vision ativo. <br />
            Localização e Telemetria sincronizados via End-to-End.
          </p>
        </div>
      </div>

      {/* QR Code Modal for Seasonal Roster */}
      {showClockInQR && (
        <div className="absolute inset-0 z-50 bg-[#FDFDF5] dark:bg-[#0A0A0A] flex flex-col p-8 items-center text-center animate-slide-up">
          <div className="w-full flex justify-end">
            <button onClick={() => setShowClockInQR(false)} className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-full active:scale-90 transition-transform">
              <X size={20} className="dark:text-white" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center -mt-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
              <Sprout className="text-emerald-500" size={32} />
            </div>

            <h3 className="text-2xl font-black dark:text-white mb-2">Portal de Sazonais</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
              Peça aos tarefeiros para lerem este código QR com a câmara do telemóvel para picarem o ponto hoje.
            </p>

            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-emerald-900/10 border-4 border-emerald-50/50 mb-8 inline-block">
              <QRCodeSVG
                value={`${window.location.origin}?clockin=true`}
                size={220}
                level="Q"
                includeMargin={false}
              />
            </div>

            <a
              href={`${window.location.origin}?clockin=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-3 rounded-xl text-center break-all w-full select-all transition-colors block border border-emerald-500/20 cursor-pointer"
            >
              {`${window.location.origin}?clockin=true`}
            </a>
          </div>

        </div>
      )}

      {/* QR Code Modal Overlay */}
      {showQRUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in p-6" onClick={() => setShowQRUser(null)}>
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-[3rem] shadow-2xl max-w-xs w-full text-center space-y-6 animate-scale-up border border-indigo-500/30" onClick={e => e.stopPropagation()}>
            <div>
              <h4 className="text-xl font-black dark:text-white uppercase italic tracking-tighter">Acesso Pessoal</h4>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{showQRUser.name}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-inner inline-block mx-auto border-4 border-indigo-50">
              <QRCodeSVG
                value={`${window.location.origin}${window.location.pathname}?onboard=${showQRUser.id}`}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-bold leading-relaxed px-4">
                Pede à <span className="text-indigo-600">{(showQRUser.name || 'Operador').split(' ')[0]}</span> para ler este código com a câmara do telemóvel para instalar e configurar a app instantaneamente.
              </p>

              <button
                onClick={() => setShowQRUser(null)}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Concluido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
