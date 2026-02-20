
import React, { useState, useMemo } from 'react';
import {
    Users, MessageSquare, Camera, Mic, MapPin,
    X, Send, ImageIcon, AlertTriangle, Clock,
    MoreHorizontal, Heart, MessageCircle, Share2,
    CheckCircle, Navigation, Radio, Shield, LogOut, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { FeedItem, UserProfile } from '../types';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';

interface FieldFeedProps {
    onClose: () => void;
}

const FieldFeed: React.FC<FieldFeedProps> = ({ onClose }) => {
    const {
        users, feedItems, currentUserId,
        addFeedItem, setCurrentUserId, notifications
    } = useStore();

    // Reset unread flag when feed is opened
    React.useEffect(() => {
        useStore.setState({ hasUnreadFeed: false });
    }, []);


    const [activeTab, setActiveTab] = useState<'feed' | 'team'>('feed');
    const [postType, setPostType] = useState<'text' | 'photo' | 'voice' | 'alert'>('text');
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const currentUser = useMemo(() =>
        users.find(u => u.id === currentUserId) || users[0],
        [users, currentUserId]);

    const handlePost = async () => {
        if (!newPostContent.trim() && postType === 'text') return;

        setIsPosting(true);
        haptics.medium();

        const newItem: FeedItem = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar || 'U',
            type: postType,
            content: newPostContent || (postType === 'voice' ? 'Mensagem de voz enviada.' : 'Foto registada no campo.'),
            timestamp: new Date().toISOString(),
            location: currentUser.safetyStatus?.location || [41.442, -8.723],
            // Randomly link to a field if applicable? No, keep it general for now.
        };

        // Simulate voice processing if type is voice
        if (postType === 'voice') {
            setNewPostContent('Transcrevendo áudio...');
            await new Promise(r => setTimeout(r, 1500));
            newItem.content = "Detectado stress hídrico severo na zona norte da Vinha. Recomendo irrigação extra.";
        }

        await addFeedItem(newItem);

        setIsPosting(false);
        setNewPostContent('');
        setPostType('text');
        haptics.success();
    };

    return (
        <div className="fixed inset-0 z-[250] flex flex-col bg-[#FDFDF5] dark:bg-[#0A0A0A] animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-10 pb-4 bg-white/50 dark:bg-black/50 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black italic uppercase text-gray-900 dark:text-white leading-none tracking-tighter flex items-center gap-2">
                        {activeTab === 'feed' ? <MessageSquare className="text-indigo-500" /> : <Users className="text-agro-green" />}
                        {activeTab === 'feed' ? 'Feed do Campo' : 'A Minha Equipa'}
                    </h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        {activeTab === 'feed' ? 'Atualizações em Tempo Real' : 'Monitorização & Perfis'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Tab Selector */}
            <div className="px-6 py-4 flex gap-4 bg-white/30 dark:bg-black/20">
                <button
                    onClick={() => { setActiveTab('feed'); haptics.light(); }}
                    className={clsx(
                        "flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                        activeTab === 'feed'
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                            : "bg-gray-100 dark:bg-neutral-800 text-gray-400"
                    )}
                >
                    Feed Social
                </button>
                <button
                    onClick={() => { setActiveTab('team'); haptics.light(); }}
                    className={clsx(
                        "flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                        activeTab === 'team'
                            ? "bg-agro-green text-white shadow-lg shadow-agro-green/30"
                            : "bg-gray-100 dark:bg-neutral-800 text-gray-400"
                    )}
                >
                    Equipa
                </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                <AnimatePresence mode="wait">
                    {activeTab === 'feed' ? (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-4 space-y-6"
                        >
                            {/* Post Creator */}
                            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-4 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                                <div className="flex gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold">
                                        {currentUser.avatar}
                                    </div>
                                    <textarea
                                        className="flex-1 bg-transparent p-2 outline-none dark:text-white font-bold text-sm resize-none custom-scrollbar"
                                        placeholder={postType === 'alert' ? "O que aconteceu? (Praga, avaria, SOS...)" : "O que está a acontecer no campo?"}
                                        rows={2}
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPostType('text')}
                                            className={clsx("p-2 rounded-xl transition-all", postType === 'text' ? "bg-indigo-100 text-indigo-600" : "text-gray-400")}
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                        <button
                                            onClick={() => setPostType('photo')}
                                            className={clsx("p-2 rounded-xl transition-all", postType === 'photo' ? "bg-blue-100 text-blue-600" : "text-gray-400")}
                                        >
                                            <Camera size={18} />
                                        </button>
                                        <button
                                            onClick={() => setPostType('voice')}
                                            className={clsx("p-2 rounded-xl transition-all", postType === 'voice' ? "bg-purple-100 text-purple-600" : "text-gray-400")}
                                        >
                                            <Mic size={18} />
                                        </button>
                                        <button
                                            onClick={() => setPostType('alert')}
                                            className={clsx("p-2 rounded-xl transition-all", postType === 'alert' ? "bg-red-100 text-red-600" : "text-gray-400")}
                                        >
                                            <AlertTriangle size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handlePost}
                                        disabled={isPosting || (!newPostContent.trim() && postType === 'text')}
                                        className={clsx(
                                            "px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all",
                                            isPosting || (!newPostContent.trim() && postType === 'text')
                                                ? "bg-gray-100 text-gray-400"
                                                : "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 active:scale-95"
                                        )}
                                    >
                                        {isPosting ? <Radio size={16} className="animate-pulse" /> : <Send size={16} />}
                                        Publicar
                                    </button>
                                </div>
                            </div>

                            {/* Feed List */}
                            <div className="space-y-4">
                                {feedItems.length === 0 ? (
                                    <div className="text-center py-20 opacity-30">
                                        <MessageSquare size={48} className="mx-auto mb-2" />
                                        <p className="font-bold uppercase tracking-widest text-xs">Sem atualizações ainda</p>
                                    </div>
                                ) : (
                                    feedItems.map((item) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={item.id}
                                            className={clsx(
                                                "bg-white dark:bg-neutral-900 rounded-[2rem] p-5 shadow-sm border transition-all",
                                                item.type === 'alert' ? "border-red-500/30" : "border-gray-100 dark:border-white/5"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold dark:text-black">
                                                            {item.userAvatar}
                                                        </div>
                                                        {item.type === 'alert' && (
                                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full animate-pulse shadow-lg">
                                                                <AlertTriangle size={8} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-gray-900 dark:text-white text-sm leading-none">{item.userName}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <MapPin size={10} className="text-indigo-500" />
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                {item.location[0].toFixed(3)}, {item.location[1].toFixed(3)}
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <Clock size={10} className="text-gray-400" />
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-gray-300 hover:text-gray-500">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </div>

                                            <div className="pl-1 text-gray-700 dark:text-gray-200 font-bold text-sm leading-relaxed mb-4">
                                                {item.content}
                                            </div>

                                            {/* Media Content (Mock) */}
                                            {item.type === 'photo' && (
                                                <div className="rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-white/5 bg-gray-100 dark:bg-neutral-800 aspect-video flex items-center justify-center">
                                                    <ImageIcon size={32} className="text-gray-300 opacity-50" />
                                                    <img
                                                        src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1498&auto=format&fit=crop"
                                                        className="w-full h-full object-cover opacity-80"
                                                        alt="Update"
                                                    />
                                                </div>
                                            )}

                                            {item.type === 'voice' && (
                                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl flex items-center gap-3 mb-4 border border-indigo-100 dark:border-indigo-900/20">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                                        <Mic size={20} />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="h-1 bg-indigo-200 dark:bg-indigo-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                animate={{ x: [0, 100, 0] }}
                                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                                className="w-1/3 h-full bg-indigo-600 rounded-full"
                                                            />
                                                        </div>
                                                        <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Audio Recording • 0:14</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Interaction Bar */}
                                            <div className="flex justify-between items-center text-gray-400 px-1">
                                                <div className="flex gap-4">
                                                    <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                                        <Heart size={18} />
                                                        <span className="text-xs font-bold">12</span>
                                                    </button>
                                                    <button className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                                                        <MessageCircle size={18} />
                                                        <span className="text-xs font-bold">4</span>
                                                    </button>
                                                </div>
                                                <button className="hover:text-agro-green transition-colors">
                                                    <Navigation size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="team"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 space-y-6"
                        >
                            {/* Current User Card */}
                            <div className="bg-agro-green/5 border border-agro-green/20 rounded-[2.5rem] p-6 flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-agro-green to-agro-yellow p-1 shadow-xl">
                                        <div className="w-full h-full rounded-full border-4 border-white dark:border-neutral-900 bg-agro-green text-white flex items-center justify-center text-2xl font-black">
                                            {currentUser.avatar}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-neutral-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none mb-1">{currentUser.name}</h3>
                                    <p className="text-[10px] font-black text-agro-green uppercase tracking-widest">{currentUser.role === 'admin' ? 'Administrador' : 'Operador Sénior'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                    <div className="bg-white dark:bg-neutral-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 mb-1 justify-center">
                                            <Navigation size={12} className="text-indigo-500" />
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Localização</span>
                                        </div>
                                        <p className="text-xs font-black dark:text-white">Active Share</p>
                                    </div>
                                    <div className="bg-white dark:bg-neutral-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 mb-1 justify-center">
                                            <Shield size={12} className="text-green-500" />
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Estado</span>
                                        </div>
                                        <p className="text-xs font-black text-green-500 uppercase">Seguro</p>
                                    </div>
                                </div>
                            </div>

                            {/* Team List */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Staff em Turno</h4>
                                {users.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => { setCurrentUserId(user.id); haptics.medium(); }}
                                        className={clsx(
                                            "w-full flex items-center gap-4 p-4 rounded-[2rem] border transition-all active:scale-95 group",
                                            user.id === currentUserId
                                                ? "bg-white dark:bg-neutral-800 border-indigo-400 shadow-lg shadow-indigo-500/10"
                                                : "bg-white/40 dark:bg-neutral-900/40 border-gray-100 dark:border-neutral-800 grayscale opacity-60"
                                        )}
                                    >
                                        <div className="relative">
                                            <div className={clsx(
                                                "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-md",
                                                user.role === 'admin' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                            )}>
                                                {user.avatar}
                                            </div>
                                            <div className={clsx(
                                                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900",
                                                user.safetyStatus?.status === 'emergency' ? "bg-red-500 animate-ping" : "bg-green-500"
                                            )} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h5 className="font-black text-gray-900 dark:text-white text-sm uppercase italic tracking-tight truncate">
                                                    {user.name}
                                                </h5>
                                                {user.id === currentUserId && <span className="px-1.5 py-0.5 bg-indigo-600 text-[8px] text-white font-black rounded uppercase tracking-tighter">EU</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">{user.role === 'admin' ? 'Gestor' : user.specialty || 'Operador'}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                    <Radio size={10} className="text-green-500" /> ON-LINE
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-full bg-gray-50 dark:bg-neutral-800 text-gray-400 group-hover:text-indigo-500 transition-colors">
                                            <ChevronDown size={18} className="-rotate-90" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all mt-4">
                                <Users size={20} /> Adicionar Membro
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Safe Area Decoration */}
            <div className="h-10 bg-gradient-to-t from-white/10 dark:from-black/10 pointer-events-none" />
        </div>
    );
};

export default FieldFeed;
