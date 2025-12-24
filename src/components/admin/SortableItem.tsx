import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Move, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // تنسيق الانتقال والتحويل بشكل انسيابي
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-200 ease-out",
        // حالة السحب: تأثير الارتفاع والإضاءة
        isDragging && "opacity-60 scale-[1.02] shadow-2xl shadow-primary/20",
        className
      )}
    >
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border bg-white transition-all",
        "hover:border-primary/30 hover:shadow-md",
        isDragging ? "border-primary ring-2 ring-primary/10" : "border-slate-100"
      )}>
        
        {/* Drag Handle - تصميم "Touch-Ready" متطور */}
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all touch-none",
            "bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary",
            "cursor-grab active:cursor-grabbing",
            isDragging && "bg-primary text-white scale-110"
          )}
          type="button"
          aria-label="سحب لإعادة الترتيب"
        >
          {isDragging ? (
            <Move className="w-5 h-5 animate-pulse" />
          ) : (
            <GripVertical className="w-5 h-5 transition-transform group-hover:scale-110" />
          )}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0 transition-all duration-300">
          <div className={cn(
            "relative",
            isDragging && "pointer-events-none select-none"
          )}>
            {children}
          </div>
        </div>

        {/* Indicator - لمسة فنية تظهر عند التحويم */}
        <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
           <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        </div>
      </div>
    </div>
  );
}
