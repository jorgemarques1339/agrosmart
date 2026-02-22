import React from 'react';
import { Skeleton } from './ui/Skeleton';
import { LayoutDashboard, Sprout, PawPrint, Package, Tractor, Wallet } from 'lucide-react';

const AppSkeleton: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden flex-col items-center justify-start w-full relative">
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide w-full max-w-md md:max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-32">
                {/* Header */}
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" className="w-12 h-12" />
                        <div className="space-y-2">
                            <Skeleton className="w-16 h-4" />
                            <Skeleton className="w-32 h-6" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton variant="circular" className="w-10 h-10" />
                        <Skeleton variant="circular" className="w-10 h-10" />
                    </div>
                </header>

                {/* Weather Card */}
                <Skeleton className="w-full h-40 mb-6" />

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                </div>

                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <Skeleton className="w-40 h-6 mb-4" />
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="w-full h-24" />
                    ))}
                </div>
            </main>

            {/* Bottom Nav Skeleton */}
            <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-neutral-900/90 border border-gray-100 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] px-2 py-3 flex items-end justify-center gap-2 z-40 w-[96%] max-w-sm md:max-w-md mx-auto backdrop-blur-md">
                {[
                    { id: 'dashboard', icon: LayoutDashboard },
                    { id: 'cultivation', icon: Sprout },
                    { id: 'animal', icon: PawPrint },
                    { id: 'stocks', icon: Package },
                    { id: 'machines', icon: Tractor },
                    { id: 'finance', icon: Wallet },
                ].map(tab => (
                    <div key={tab.id} className="p-2 mb-1 flex flex-col items-center gap-1 opacity-50">
                        <tab.icon size={22} className="text-gray-400" />
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default AppSkeleton;
