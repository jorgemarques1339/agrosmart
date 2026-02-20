
import React, { useState, useMemo } from 'react';
import {
    Users, MessageSquare, Camera, Mic, MapPin,
    X, Send, ImageIcon, AlertTriangle, Clock,
    MoreHorizontal, Heart, MessageCircle, Share2,
    CheckCircle, Navigation, Radio, Shield, LogOut, ChevronDown,
    Video, Play, Volume2, Square
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
        addFeedItem, setCurrentUserId, notifications,
        openModal
    } = useStore();

    // Reset unread flag when feed is opened
    React.useEffect(() => {
        useStore.setState({ hasUnreadFeed: false });
    }, []);


    const [activeTab, setActiveTab] = useState<'feed' | 'team'>('feed');
    const [postType, setPostType] = useState<'text' | 'photo' | 'voice' | 'video' | 'alert'>('text');
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const currentUser = useMemo(() =>
        users.find(u => u.id === currentUserId) || users[0],
        [users, currentUserId]);

    const stopMedia = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsRecording(false);
    };

    const startMedia = async (type: 'video' | 'voice') => {
        stopMedia();
        try {
            const constraints = {
                audio: true,
                video: type === 'video' ? { facingMode: 'environment' } : false
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (type === 'video' && videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
            alert("Não foi possível aceder à câmara/microfone. Por favor, verifique as permissões.");
            setPostType('text');
        }
    };

    React.useEffect(() => {
        if (postType === 'video' || postType === 'voice') {
            startMedia(postType as 'video' | 'voice');
        } else {
            stopMedia();
        }
        return () => stopMedia();
    }, [postType]);

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

        if (postType === 'video') {
            setNewPostContent('Processando vídeo...');
            await new Promise(r => setTimeout(r, 2000));
            newItem.content = "Registo visual da manutenção preventiva no pivô central.";
            newItem.mediaUrl = "https://assets.mixkit.co/videos/preview/mixkit-sprinklers-watering-a-green-lawn-1358-large.mp4";
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
                                    <div className="flex-1 min-h-[80px] flex flex-col gap-2">
                                        <textarea
                                            className="w-full bg-transparent p-2 outline-none dark:text-white font-bold text-sm resize-none custom-scrollbar"
                                            placeholder={postType === 'alert' ? "O que aconteceu? (Praga, avaria, SOS...)" : "O que está a acontecer no campo?"}
                                            rows={2}
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                        />

                                        {postType === 'video' && stream && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-orange-500/30 shadow-lg"
                                            >
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-glow" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">LIVE PREVIEW</span>
                                                </div>
                                            </motion.div>
                                        )}

                                        {postType === 'voice' && stream && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="h-20 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-center gap-4 overflow-hidden"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                        <motion.div
                                                            key={i}
                                                            animate={{ height: [12, 32, 12] }}
                                                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                            className="w-1.5 bg-purple-500 rounded-full shadow-lg shadow-purple-500/20"
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">A gravar áudio...</span>
                                                    <span className="text-[8px] font-bold text-purple-400 uppercase">Input detectado</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
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
                                            onClick={() => setPostType('video')}
                                            className={clsx("p-2 rounded-xl transition-all", postType === 'video' ? "bg-orange-100 text-orange-600" : "text-gray-400")}
                                        >
                                            <Video size={18} />
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
                                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl flex items-center gap-4 mb-4 border border-indigo-100 dark:border-indigo-900/20">
                                                    <button className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">
                                                        <Play size={20} fill="currentColor" />
                                                    </button>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <div className="flex gap-0.5 items-end h-6">
                                                                {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5, 0.4, 0.6, 0.9, 0.7, 0.5, 0.8, 0.4].map((h, i) => (
                                                                    <motion.div
                                                                        key={i}
                                                                        initial={{ height: "20%" }}
                                                                        animate={{ height: `${h * 100}%` }}
                                                                        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                                                                        className="w-1 bg-indigo-400 rounded-full"
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] font-black text-indigo-400 font-mono tracking-tighter">00:14 / 00:14</span>
                                                        </div>
                                                        <div className="h-1 bg-indigo-200 dark:bg-indigo-800 rounded-full overflow-hidden">
                                                            <div className="w-full h-full bg-indigo-600 rounded-full" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {item.type === 'video' && (
                                                <div className="relative rounded-[1.5rem] overflow-hidden mb-4 border border-gray-100 dark:border-white/5 bg-black group/video shadow-2xl">
                                                    <video
                                                        src={item.mediaUrl || "https://assets.mixkit.co/videos/preview/mixkit-sprinklers-watering-a-green-lawn-1358-large.mp4"}
                                                        className="w-full aspect-video object-cover opacity-90"
                                                        muted
                                                        playsInline
                                                        loop
                                                        autoPlay
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                                        <div className="flex items-center gap-3 w-full">
                                                            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform">
                                                                <Play size={18} fill="currentColor" />
                                                            </button>
                                                            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    animate={{ x: [0, 100, 0] }}
                                                                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                                                    className="w-1/4 h-full bg-agro-green"
                                                                />
                                                            </div>
                                                            <Volume2 size={18} className="text-white opacity-80" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-4 left-4 flex gap-2">
                                                        <span className="px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded-md flex items-center gap-1 shadow-lg">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                                                        </span>
                                                        <span className="px-2 py-1 bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase rounded-md shadow-lg border border-white/10">
                                                            HD 1080P
                                                        </span>
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
