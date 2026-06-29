declare module 'framer-motion' {
  import * as React from 'react';

  type MotionProps = Record<string, unknown>;

  export const motion: {
    div: React.ComponentType<React.HTMLAttributes<HTMLDivElement> & MotionProps>;
    span: React.ComponentType<React.HTMLAttributes<HTMLSpanElement> & MotionProps>;
    [key: string]: React.ComponentType<Record<string, unknown>>;
  };
  export const AnimatePresence: React.ComponentType<{
    children?: React.ReactNode;
    mode?: string;
    [key: string]: unknown;
  }>;
  export function useAnimation(): { start: () => void; stop: () => void };
}

declare module 'firebase/app' {
  export function initializeApp(options: Record<string, unknown>, name?: string): unknown;
  export function getApp(name?: string): unknown;
  export function getApps(): unknown[];
}

declare module 'firebase/firestore/lite' {
  export function getFirestore(app?: unknown): unknown;
  export function getDoc(ref: unknown): Promise<{ id: string; data(): Record<string, unknown>; exists(): boolean }>;
  export function collection(db: unknown, path: string, ...segments: string[]): unknown;
  export function getDocs(ref: unknown): Promise<{ docs: { id: string; data(): Record<string, unknown> }[] }>;
  export function addDoc(ref: unknown, data: unknown): Promise<{ id: string }>;
  export function doc(db: unknown, path: string, ...segments: string[]): unknown;
  export function setDoc(ref: unknown, data: unknown, options?: unknown): Promise<void>;
  export function updateDoc(ref: unknown, data: unknown): Promise<void>;
  export function deleteDoc(ref: unknown): Promise<void>;
  export function query(ref: unknown, ...constraints: unknown[]): unknown;
  export function where(field: string, op: string, value: unknown): unknown;
  export function orderBy(field: string, direction?: string): unknown;
  export function limit(n: number): unknown;
  export function onSnapshot(ref: unknown, callback: (snapshot: unknown) => void): () => void;
  export type DocumentData = Record<string, unknown>;
  export type Firestore = unknown;
}
