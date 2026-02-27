import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sprout, PawPrint, Package, Tractor, Wallet } from 'lucide-react';
import { useStore, isAnyModalOpen } from '../store/useStore';
import { UserProfile } from '../types';
import { haptics } from '../utils/haptics';

export const BottomNavigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

    const users = useStore(state => state.users);
    const currentUserId = useStore(state => state.currentUserId);
    const isAnyModalOpenValue = useStore(isAnyModalOpen);

    const currentUser = useMemo(() => {
        if (!users) return { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
        return users.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
    }, [users, currentUserId]);

    return (
        <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-neutral-900/90 border border-gray-100 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] px-2 py-3 flex items-end justify-center gap-2 z-40 w-[96%] max-w-sm md:max-w-md mx-auto backdrop-blur-md transition-all duration-300 ease-in-out ${isAnyModalOpenValue ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Home', path: '/' },
                { id: 'cultivation', icon: Sprout, label: 'Cultivo', path: '/cultivation' },
                { id: 'animal', icon: PawPrint, label: 'Animais', path: '/animal' },
                { id: 'stocks', icon: Package, label: 'Stock', path: '/stocks' },
                { id: 'machines', icon: Tractor, label: 'Frota', path: '/machines' },
                { id: 'finance', icon: Wallet, label: 'Finanças', path: '/finance' },
            ].filter(tab => {
                const role = currentUser.role;
                if (role === 'admin') return true;
                if (tab.id === 'dashboard') return true;
                if (tab.id === 'finance') return false;

                const specialty = currentUser.specialty?.toLowerCase() || '';
                if (tab.id === 'animal' && (role === 'vet' || specialty.includes('anim'))) return true;
                if (tab.id === 'machines' && (role === 'mechanic' || specialty.includes('mecan'))) return true;
                if (['cultivation', 'stocks'].includes(tab.id) && (role === 'farmer' || specialty.includes('agric'))) return true;

                return false;
            }).map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { haptics.light(); navigate(tab.path); }}
                    className={`transition-all duration-300 flex flex-col items-center justify-center rounded-2xl relative ${activeTab === tab.id
                        ? 'bg-agro-green text-white shadow-lg shadow-agro-green/30 -translate-y-2 py-2 px-3 min-w-[56px] mb-1'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent p-2 mb-1'
                        }`}
                >
                    <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    {activeTab === tab.id && (
                        <span className="text-[9px] font-bold mt-1 animate-fade-in whitespace-nowrap leading-none">
                            {tab.label}
                        </span>
                    )}
                </button>
            ))}
        </nav>
    );
};
