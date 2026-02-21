import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { haptics } from '../utils/haptics';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useStore(state => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const success = await login(username, password);
            if (success) {
                haptics.success();
            } else {
                setError('Credenciais inválidas. Verifique o utilizador e a palavra-passe.');
                haptics.error();
            }
        } catch (err) {
            setError('Ocorreu um erro ao processar o login. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[9999] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-500/5 blur-[100px] rounded-full animate-pulse" />

            <div className="w-full max-w-md p-8 relative z-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                        <Lock className="text-emerald-400" size={36} />
                    </div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent tracking-tighter">
                        OrivaSmart
                    </h1>
                    <p className="text-emerald-500/50 text-[10px] font-black uppercase tracking-[0.4em] mt-2 text-center">
                        Portal de Acesso Seguro
                    </p>
                </div>

                {/* Form Section */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl"
                >
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 ml-1">Utilizador</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User size={18} className="text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
                                placeholder="ex: jorge_marques"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 ml-1">Palavra-passe</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={18} className="text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 group"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <span className="uppercase tracking-widest text-xs">Entrar no Ecossistema</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Info */}
                <div className="text-center mt-8">
                    <p className="text-white/20 text-[10px] font-medium leading-relaxed uppercase tracking-tighter">
                        &copy; 2026 AgroSmart Enterprise
                        <br />
                        Encriptação Ponta-a-Ponta • Cloud Sync Ativa
                    </p>
                </div>
            </div>
        </div>
    );
};
