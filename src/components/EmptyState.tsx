import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Empty className="border border-dashed border-[var(--border)] bg-[var(--bg-card)]/70 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && onAction ? (
        <EmptyContent>
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
