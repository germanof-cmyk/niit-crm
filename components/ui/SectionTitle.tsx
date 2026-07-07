import { type LucideIcon } from 'lucide-react';

interface SectionTitleProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

export default function SectionTitle({ icon: Icon, children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-[15px] h-[15px] shrink-0" style={{ color: '#F7661E' }} />
      <span
        className="text-[11px] font-extrabold uppercase tracking-wider"
        style={{ color: '#1C4061' }}
      >
        {children}
      </span>
      <div
        style={{
          width: 32,
          height: 3,
          background: '#F7661E',
          borderRadius: 9999,
          flexShrink: 0,
        }}
      />
    </div>
  );
}
