
import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, User, Save, Info, Moon, Sun, Monitor, Download, Upload, Shield, CheckCircle, MapPin, Camera, Zap, Activity } from 'lucide-react';
import { STORAGE_KEY } from '../constants';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  currentName: string;
  onSaveName: (name: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isSolarMode: boolean;
  onToggleSolarMode: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  currentName,
  onSaveName,
  isDarkMode,
  onToggleDarkMode,
  isSolarMode,
  onToggleSolarMode
}) => {
  const { permissions, setPermission } = useStore();
  const [tempName, setTempName] = useState(currentName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isTesting, setIsTesting] = useState(false);
  const [stressTestStatus, setStressTestStatus] = useState<string | null>(null);

  // Sincronizar o estado local quando o modal abre ou o nome muda externamente
  useEffect(() => {
    setTempName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (tempName.trim()) {
      onSaveName(tempName);
    }
  };

  const handleResetConfirm = () => {
    if (window.confirm("Tem a certeza absoluta? Todos os dados, animais e campos serão apagados irreversivelmente.")) {
      onResetData();
    }
  };

  // --- HARDWARE PERMISSIONS LOGIC ---
  const requestGPS = () => {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setPermission('gps', true),
      () => setPermission('gps', false)
    );
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPermission('camera', true);
    } catch (err) {
      setPermission('camera', false);
      alert("Acesso à câmara negado.");
    }
  };

  const requestMotion = async () => {
    // DeviceMotionEvent.requestPermission exists in iOS
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        setPermission('motion', response === 'granted');
      } catch (err) {
        setPermission('motion', false);
      }
    } else {
      // Android/Desktop usually don't require explicit "permission" prompt like iOS, just access
      setPermission('motion', true);
    }
  };

  const requestNFC = () => {
    if ('NDEFReader' in window) {
      setPermission('nfc', true);
    } else {
      alert("NFC não suportado ou requer HTTPS.");
    }
  };

  // --- BACKUP LOGIC ---
  const handleExportBackup = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        alert("Não existem dados para exportar.");
        return;
      }

      // Criar Blob e Link de Download
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Nome do ficheiro com data: oriva_backup_2023-10-27.json
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `oriva_backup_${dateStr}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar backup:", error);
      alert("Erro ao criar ficheiro de backup.");
    }
  };

  const handleImportClick = () => {
    // Disparar o input de ficheiro oculto
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (window.confirm("ATENÇÃO: Importar um backup irá SUBSTITUIR todos os dados atuais deste dispositivo. Deseja continuar?")) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Validação simples JSON
          const parsed = JSON.parse(content);

          if (parsed && typeof parsed === 'object') {
            // Guardar no LocalStorage
            localStorage.setItem(STORAGE_KEY, content);
            alert("Backup restaurado com sucesso! A aplicação irá reiniciar.");
            window.location.reload();
          } else {
            throw new Error("Formato inválido");
          }
        } catch (error) {
          console.error("Erro ao importar:", error);
          alert("Ficheiro inválido ou corrompido. Certifique-se que é um ficheiro .json gerado pela Oriva.");
        }
      };

      reader.readAsText(file);
    }

    // Reset input para permitir selecionar o mesmo ficheiro novamente se falhar
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop com efeito vidro */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Container do Modal */}
      <div className="relative w-full max-w-sm bg-[#FDFDF5] dark:bg-[#0A0A0A] rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh] border border-white/20 dark:border-neutral-800">

        {/* Header Fixo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Definições</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-gray-600 dark:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">

          {/* 1. Secção: Perfil */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 ml-1 uppercase tracking-wider">Perfil</h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-l-[1.5rem] rounded-r-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-agro-green focus:outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={tempName === currentName}
                className={`px-5 rounded-r-[1.5rem] rounded-l-lg font-bold text-white transition-all flex items-center justify-center shadow-lg shadow-agro-green/20 ${tempName === currentName ? 'bg-gray-300 dark:bg-neutral-700 cursor-not-allowed' : 'bg-agro-green active:scale-95'}`}
              >
                <Save size={20} />
              </button>
            </div>
          </section>

          {/* 2. Secção: Permissões de Hardware */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 ml-1 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} /> Permissões de Hardware
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* GPS */}
              <button
                onClick={requestGPS}
                className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${permissions.gps ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 text-emerald-600' : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 text-gray-400'}`}
              >
                <MapPin size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{permissions.gps ? 'GPS Ativo' : 'GPS'}</span>
              </button>

              {/* Camera */}
              <button
                onClick={requestCamera}
                className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${permissions.camera ? 'bg-agro-green/10 border-agro-green/20 text-agro-green' : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 text-gray-400'}`}
              >
                <Camera size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{permissions.camera ? 'Câmara OK' : 'Câmara'}</span>
              </button>

              {/* NFC */}
              <button
                onClick={requestNFC}
                className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${permissions.nfc ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 text-blue-600' : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 text-gray-400'}`}
              >
                <Zap size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{permissions.nfc ? 'NFC Ativo' : 'NFC'}</span>
              </button>

              {/* Motion */}
              <button
                onClick={requestMotion}
                className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${permissions.motion ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800 text-amber-600' : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 text-gray-400'}`}
              >
                <Activity size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{permissions.motion ? 'Movimento' : 'Sensores'}</span>
              </button>
            </div>
          </section>

          {/* 3. Secção: Aparência */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 ml-1 uppercase tracking-wider">Aparência</h3>

            {/* Toggle Dark Mode */}
            <div
              className={`bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-sm ${isSolarMode ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={!isSolarMode ? onToggleDarkMode : undefined}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Modo {isDarkMode ? 'Escuro' : 'Claro'}</p>
                  <p className="text-xs text-gray-500">Ajustar tema visual</p>
                </div>
              </div>

              {/* Toggle Switch Visual */}
              <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-agro-green' : 'bg-gray-200'}`}>
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Toggle Solar Mode */}
            <div
              className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
              onClick={onToggleSolarMode}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${isSolarMode ? 'bg-black text-yellow-400' : 'bg-yellow-50 text-yellow-600'}`}>
                  <Sun size={20} fill={isSolarMode ? "currentColor" : "none"} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Modo Solar</p>
                  <p className="text-xs text-gray-500">Alto contraste para exterior</p>
                </div>
              </div>

              {/* Toggle Switch Visual */}
              <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isSolarMode ? 'bg-black' : 'bg-gray-200'}`}>
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isSolarMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
          </section>

          {/* 4. Secção: Segurança & Backup */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 ml-1 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} /> Segurança de Dados
            </h3>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Os seus dados estão guardados apenas neste dispositivo. Faça backups regulares para não perder a sua informação.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportBackup}
                  className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl active:scale-95 transition-all hover:bg-green-100 dark:hover:bg-green-900/20"
                >
                  <Download size={24} className="text-green-600 dark:text-green-400 mb-1" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-300">Guardar Ficheiro</span>
                </button>

                <button
                  onClick={handleImportClick}
                  className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl active:scale-95 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/20"
                >
                  <Upload size={24} className="text-blue-600 dark:text-blue-400 mb-1" />
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Restaurar Dados</span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </section>

          {/* Secção: Sistema */}
          <section>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex gap-4 items-start">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-300 rounded-full shrink-0">
                <Info size={18} />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">Oriva Enterprise</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300/70 mt-1 leading-relaxed">
                  Versão 1.4.0 (Oriva Rebrand)<br />
                  Arquitetura Offline-First ativa. Os dados são guardados localmente no seu dispositivo.
                </p>
              </div>
            </div>
          </section>

          {/* Secção: Edge Computing / Developer Tools */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-purple-500 dark:text-purple-400 mb-3 ml-1 uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} /> Edge Computing Test
            </h3>
            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-3xl border border-purple-100 dark:border-purple-900/30 space-y-4">
              <p className="text-xs text-purple-700 dark:text-purple-300/80 leading-relaxed">
                Testes de performance Offline-First. Injeta registos via Web Worker em background sem bloquear a interface de utilizador.
              </p>

              {stressTestStatus && (
                <div className="bg-white/60 dark:bg-black/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800/50">
                  <p className="text-xs font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    {isTesting ? <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> : <CheckCircle size={14} className="text-emerald-500" />}
                    {stressTestStatus}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    setIsTesting(true);
                    setStressTestStatus('A iniciar...');
                    const { syncManager } = await import('../services/SyncManager');
                    await syncManager.runStressTest(100000, (msg) => setStressTestStatus(msg));
                    setIsTesting(false);
                  }}
                  disabled={isTesting}
                  className="w-full py-3 bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-800/50 rounded-2xl text-purple-700 dark:text-purple-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 hover:border-purple-400 dark:hover:border-purple-600"
                >
                  Gera 100k Registos
                </button>

                <button
                  onClick={async () => {
                    setIsTesting(true);
                    setStressTestStatus('A limpar...');
                    const { syncManager } = await import('../services/SyncManager');
                    await syncManager.clearStressTest((msg) => setStressTestStatus(msg));
                    setIsTesting(false);
                  }}
                  disabled={isTesting}
                  className="w-full py-3 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 hover:border-red-400 dark:hover:border-red-600"
                >
                  <Trash2 size={14} /> Limpar Teste
                </button>
              </div>
            </div>
          </section>

          {/* Secção: Zona de Perigo */}
          <section className="pt-2">
            <button
              onClick={handleResetConfirm}
              className="w-full p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <Trash2 size={18} />
              Limpar Todos os Dados
            </button>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;