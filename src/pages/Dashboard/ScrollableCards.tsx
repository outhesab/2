import { useState, useRef, useEffect, useCallback } from 'react';
import { StatCard } from './StatCard';
import type { StatCardData } from './types';

interface ScrollableCardsProps {
  cards: StatCardData[];
  onTabChange: (tab: string) => void;
}

export function ScrollableCards({ cards, onTabChange }: ScrollableCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scroll: 0 });

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, [updateArrows]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, scroll: scrollRef.current?.scrollLeft || 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    scrollRef.current.scrollLeft = dragStart.current.scroll - dx;
  };
  const onPointerUp = () => setIsDragging(false);

  return (
    <div className="dash-scroll-wrap">
      <button className={`dash-nav-btn dash-nav-btn-left ${canLeft ? 'visible' : 'hidden'}`} onClick={() => scroll(-1)}>
        ‹
      </button>
      <button
        className={`dash-nav-btn dash-nav-btn-right ${canRight ? 'visible' : 'hidden'}`}
        onClick={() => scroll(1)}
      >
        ›
      </button>
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={`dash-scroll-inner${isDragging ? ' dragging' : ''}`}
        style={{
          maskImage: `linear-gradient(to right, ${canLeft ? 'transparent 0%, black 5%' : 'black 0%'}, ${canRight ? 'black 95%, transparent 100%' : 'black 100%'})`,
        }}
      >
        {cards.map((card, i) => (
          <div key={i} className="dash-scroll-item">
            <StatCard {...card} onClick={card.tab ? () => onTabChange(card.tab!) : undefined} />
          </div>
        ))}
      </div>
    </div>
  );
}
