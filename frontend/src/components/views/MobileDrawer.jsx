import { createPortal } from 'react-dom';
import MenuList from "../menu/MenuList";

export default function MobileDrawer({ isOpen, onClose, navigateTo, onViewChange, currentPath }) {
    if (!isOpen) return null;

    // This "teleports" the HTML to the very end of the <body> tag
    return createPortal(
        <div className="sm:hidden relative z-[9999] w-[full]">
            {/* 1. BACKDROP: Covers whole screen, doesn't scroll */}
            <div
                className="fixed inset-0 bg-black/60 cursor-pointer"
                onClick={onClose}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* 2. SLIDING PANEL: Floating layer */}
            <div
                className="fixed inset-y-0 left-0 w-[300px] bg-[#1e1f20] shadow-4xl flex flex-col rounded-r-2xl "
                style={{
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 10000
                }}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-700">
                    <span className="text-white font-bold">Menu</span>
                    <button onClick={onClose} className="text-white text-3xl px-2">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto h-full w-full">
                    <MenuList
                        isMobile={true}
                        onClose={onClose}
                        navigateTo={navigateTo}
                        onViewChange={onViewChange}
                        currentPath={currentPath}
                    />
                </div>
            </div>
        </div>,
        document.body // This is the teleport destination
    );
}