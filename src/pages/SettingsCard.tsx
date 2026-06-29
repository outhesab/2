import React from 'react';
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ShadcnCard className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </ShadcnCard>
  );
}
