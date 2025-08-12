import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DropdownMenuPortal = ({ children, anchorRef, onClose }) => {
    const menuRef = useRef();
    const [style, setStyle] = useState({});

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                anchorRef.current &&
                !anchorRef.current.contains(event.target)
            ) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorRef]);

    useEffect(() => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setStyle({
                position: 'absolute',
                top: rect.bottom + window.scrollY + 4,
                left: rect.right - 100 + window.scrollX, // 160 là width menu
                zIndex: 9999,
            });
        }
    }, [anchorRef]);

    return createPortal(
        <div ref={menuRef} style={style} className="member-action-menu w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
            {children}
        </div>,
        document.body
    );
};

export default DropdownMenuPortal; 