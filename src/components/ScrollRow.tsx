import React, { useRef, forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import '../styles/scrollRow.scss';

interface ScrollRowProps {
    children: React.ReactNode;
    title?: string;
}

export interface ScrollRowHandle {
    getScrollLeft: () => number;
    setScrollLeft: (value: number) => void;
}

export const ScrollRow = forwardRef<ScrollRowHandle, ScrollRowProps>(({ children, title }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;

        setShowLeftArrow(el.scrollLeft > 0);
        setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    const scrollBy = (amount: number) => {
        scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            setShowRightArrow(el.scrollWidth > el.clientWidth);
        }
    }, [children]);

    // Expose scrollRef to parent
    useImperativeHandle(ref, () => ({
        getScrollLeft: () => scrollRef.current?.scrollLeft ?? 0,
        setScrollLeft: (value: number) => {
            if (scrollRef.current) {
                scrollRef.current.scrollLeft = value;
            }
        },
    }));
    

    return (
        <div className="scroll-row">
            {title && <h2 className="scroll-title">{title}</h2>}
            <div className="scroll-wrapper">
                {showLeftArrow && (
                    <button className="scroll-button left" onClick={() => scrollBy(-scrollRef.current!.clientWidth * 0.8)}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                )}
                <div className="scroll-container" ref={scrollRef} onScroll={handleScroll}>
                    {children}
                </div>
                {showRightArrow && (
                    <button className="scroll-button right" onClick={() => scrollBy(scrollRef.current!.clientWidth * 0.8)}>
                        <i className="bi bi-chevron-right"></i>
                    </button>
                )}
                <div className="gradient-left" />
                <div className="gradient-right" />
            </div>
        </div>
    );
});