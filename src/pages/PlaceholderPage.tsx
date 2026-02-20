import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4">
      <Construction size={48} className="opacity-30" />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-secondary mb-1">{title}</h2>
        <p className="text-sm">준비 중입니다. 기획안 확정 후 구현 예정입니다.</p>
      </div>
    </div>
  );
}
