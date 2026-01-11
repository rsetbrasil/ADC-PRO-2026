
'use client';
import React from 'react';
import Image from 'next/image';
import { useSettings } from '@/context/SettingsContext';

const DefaultLogo = () => (
    <div className="flex flex-col items-center" style={{ lineHeight: '1' }}>
        <div className="flex items-center text-4xl font-extrabold tracking-tighter font-headline">
            <span className="text-accent">A</span>
            <span className="text-primary">D</span>
            <div className="relative text-primary">
            C
            {/* Orange square inside C */}
            <div className="absolute bg-accent w-[0.25em] h-[0.25em]" style={{ top: '50%', left: '45%', transform: 'translate(-50%, -50%)' }}></div>
            </div>
            {/* Two blue squares to the right of C */}
            <div className="grid grid-rows-2 gap-[1.5px] ml-0.5 self-center">
            <div className="bg-primary w-[0.25em] h-[0.25em]"></div>
            <div className="bg-primary w-[0.25em] h-[0.25em]"></div>
            </div>
        </div>
        <div className="text-accent text-[0.5rem] font-bold tracking-[0.1em] mt-0.5">
            MÓVEIS E ELETRO
        </div>
    </div>
);

const Logo = () => {
    const { settings, isLoading } = useSettings();

    if (isLoading) {
        // Return a placeholder or the default logo while loading
        return <DefaultLogo />;
    }

    if (settings.logoUrl) {
        return (
            <div className="relative w-32 h-14">
                <Image 
                    src={settings.logoUrl} 
                    alt={settings.storeName} 
                    fill
                    className="object-contain" 
                    sizes="130px"
                />
            </div>
        );
    }
  
    return <DefaultLogo />;
};

export default Logo;
