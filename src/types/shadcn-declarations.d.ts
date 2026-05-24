declare module 'react-day-picker' {
  import * as React from 'react';

  export type DayButton = HTMLButtonElement;

  export interface DayPickerProps {
    children?: React.ReactNode;
    className?: string;
    mode?: 'single' | 'multiple' | 'range';
    selected?: Date | Date[] | { from: Date; to: Date } | undefined;
    onSelect?: (date: Date | Date[] | { from: Date; to: Date } | undefined) => void;
    defaultMonth?: Date;
    month?: Date;
    onMonthChange?: (month: Date) => void;
    numberOfMonths?: number;
    disabled?: boolean | Date | Date[] | { before: Date; after: Date };
    fromDate?: Date;
    toDate?: Date;
    formatters?: Record<string, (date: Date) => string>;
    labels?: Record<string, (date: Date) => string>;
    locale?: Locale;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    firstWeekContainsDate?: number;
    showWeekNumber?: boolean;
    showOutsideDays?: boolean;
    fixedWeeks?: boolean;
    captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
    hideHead?: boolean;
    showNavigation?: boolean;
    [key: string]: unknown;
  }

  export function getDefaultClassNames(): Record<string, string>;

  export const DayPicker: React.ComponentType<DayPickerProps>;
  export default DayPicker;
}

declare module 'embla-carousel-react' {
  import * as React from 'react';

  export type EmblaCarouselType = {
    canScrollNext: () => boolean;
    canScrollPrev: () => boolean;
    scrollNext: () => void;
    scrollPrev: () => void;
    scrollTo: (index: number) => void;
    selectedScrollSnap: () => number;
    scrollSnapList: () => number[];
    containerNode: () => HTMLElement | undefined;
    slidesInView: () => number[];
    slidesNotInView: () => number[];
    on: (event: string, callback: () => void) => void;
    off: (event: string, callback: () => void) => void;
    destroy: () => void;
    [key: string]: unknown;
  };

  export type EmblaOptionsType = {
    align?: 'start' | 'center' | 'end' | number;
    axis?: 'x' | 'y';
    containScroll?: boolean | 'trimSnaps' | 'keepSnaps';
    direction?: 'ltr' | 'rtl';
    dragFree?: boolean;
    dragThreshold?: number;
    duration?: number;
    inViewThreshold?: number;
    loop?: boolean;
    skipSnaps?: boolean;
    slidesToScroll?: number | 'auto';
    speed?: number;
    startIndex?: number;
    watchDrag?: boolean;
    watchResize?: boolean;
    watchSlides?: boolean;
    watchFocus?: boolean;
    [key: string]: unknown;
  };

  export type EmblaPluginType = {
    name: string;
    init: (embla: EmblaCarouselType, options: EmblaOptionsType) => void;
    destroy?: () => void;
    [key: string]: unknown;
  };

  export type UseEmblaCarouselType = [
    React.RefCallback<HTMLElement>,
    EmblaCarouselType | undefined
  ];

  export function useEmblaCarousel(
    options?: EmblaOptionsType,
    plugins?: EmblaPluginType[]
  ): UseEmblaCarouselType;

  export default useEmblaCarousel;
}

declare module 'cmdk' {
  import * as React from 'react';

  type CommandBaseProps = {
    children?: React.ReactNode;
    className?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    filter?: (value: string, search: string, keywords?: string[]) => boolean;
    disabled?: boolean;
  };

  type CommandItemProps = {
    children?: React.ReactNode;
    className?: string;
    value?: string;
    disabled?: boolean;
    keywords?: string[];
    onSelect?: (value: string) => void;
    forceMount?: boolean;
  };

  type CommandGroupProps = {
    children?: React.ReactNode;
    className?: string;
    value?: string;
    forceMount?: boolean;
    heading?: React.ReactNode;
  };

  type CommandSeparatorProps = {
    className?: string;
    alwaysRender?: boolean;
  };

  type CommandEmptyProps = {
    children?: React.ReactNode;
    className?: string;
  };

  type CommandInputProps = {
    className?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  };

  type CommandListProps = {
    children?: React.ReactNode;
    className?: string;
  };

  export const Command: React.ForwardRefExoticComponent<CommandBaseProps & React.RefAttributes<HTMLElement>> & {
    Item: React.ForwardRefExoticComponent<CommandItemProps & React.RefAttributes<HTMLElement>>;
    Group: React.ForwardRefExoticComponent<CommandGroupProps & React.RefAttributes<HTMLElement>>;
    Separator: React.ForwardRefExoticComponent<CommandSeparatorProps & React.RefAttributes<HTMLElement>>;
    Empty: React.ForwardRefExoticComponent<CommandEmptyProps & React.RefAttributes<HTMLElement>>;
    Input: React.ForwardRefExoticComponent<CommandInputProps & React.RefAttributes<HTMLElement>>;
    List: React.ForwardRefExoticComponent<CommandListProps & React.RefAttributes<HTMLElement>>;
  };

  export { Command };
  export default Command;
}

declare module 'input-otp' {
  import * as React from 'react';

  type OTPInputProps = {
    children?: React.ReactNode;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
    maxLength: number;
    disabled?: boolean;
    containerClassName?: string;
    render?: (props: { slots: { char: string | null }[] }) => React.ReactNode;
    [key: string]: unknown;
  };

  type OTPInputContextValue = {
    slots: { char: string | null; hasFakeCaret: boolean }[];
    value: string;
    maxLength: number;
    onChange: (value: string) => void;
    disabled?: boolean;
  };

  export const OTPInput: React.ComponentType<OTPInputProps>;
  export const OTPInputContext: React.Context<OTPInputContextValue | null>;
  export default OTPInput;
}

declare module 'react-hook-form' {
  import * as React from 'react'

  export type FieldValues = Record<string, unknown>
  export type FieldPath<T extends FieldValues> = string & keyof T
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ControllerProps<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>> = {
    name: N
    control?: unknown
    render: (props: { field: { value: unknown; onChange: (...args: unknown[]) => void; onBlur: () => void; ref: React.Ref<unknown> } }) => React.ReactNode
  }
  export type UseFormReturn = {
    control: unknown
    handleSubmit: (callback: (data: unknown) => void) => (e: React.FormEvent) => void
    formState: { errors: Record<string, unknown> }
    register: (name: string) => Record<string, unknown>
    reset: (values?: unknown) => void
    watch: (name?: string) => unknown
    setValue: (name: string, value: unknown) => void
    getFieldState: (name: string, formState?: { errors: Record<string, unknown> }) => { invalid: boolean; error?: { message?: string } }
  }
  export function useFormContext<T extends FieldValues>(): UseFormReturn
  export const FormProvider: React.ComponentType<{ children: React.ReactNode }>
  export const Controller: React.ComponentType<ControllerProps>
  export function useForm<T extends FieldValues>(defaultValues?: unknown): UseFormReturn
}

declare module 'framer-motion' {
  import * as React from 'react'

  type MotionProps = Record<string, unknown>

  export const motion: {
    div: React.ComponentType<React.HTMLAttributes<HTMLDivElement> & MotionProps>
    span: React.ComponentType<React.HTMLAttributes<HTMLSpanElement> & MotionProps>
    [key: string]: React.ComponentType<Record<string, unknown>>
  }
  export const AnimatePresence: React.ComponentType<{ children?: React.ReactNode; mode?: string; [key: string]: unknown }>
  export function useAnimation(): { start: () => void; stop: () => void }
}

declare module 'firebase/app' {
  export function initializeApp(options: Record<string, unknown>, name?: string): unknown
  export function getApp(name?: string): unknown
  export function getApps(): unknown[]
}

declare module 'firebase/firestore/lite' {
  export function getFirestore(app?: unknown): unknown
  export function getDoc(ref: unknown): Promise<{ id: string; data(): Record<string, unknown>; exists(): boolean }>
  export function collection(db: unknown, path: string, ...segments: string[]): unknown
  export function getDocs(ref: unknown): Promise<{ docs: { id: string; data(): Record<string, unknown> }[] }>
  export function addDoc(ref: unknown, data: unknown): Promise<{ id: string }>
  export function doc(db: unknown, path: string, ...segments: string[]): unknown
  export function setDoc(ref: unknown, data: unknown, options?: unknown): Promise<void>
  export function updateDoc(ref: unknown, data: unknown): Promise<void>
  export function deleteDoc(ref: unknown): Promise<void>
  export function query(ref: unknown, ...constraints: unknown[]): unknown
  export function where(field: string, op: string, value: unknown): unknown
  export function orderBy(field: string, direction?: string): unknown
  export function limit(n: number): unknown
  export function onSnapshot(ref: unknown, callback: (snapshot: unknown) => void): () => void
  export type DocumentData = Record<string, unknown>
  export type Firestore = unknown
}

declare module 'react-resizable-panels' {
  import * as React from 'react';

  type PanelGroupProps = {
    children?: React.ReactNode;
    className?: string;
    direction: 'horizontal' | 'vertical';
    onLayout?: (sizes: number[]) => void;
    autoSaveId?: string;
    storage?: { getItem: (name: string) => string | null; setItem: (name: string, value: string) => void };
    [key: string]: unknown;
  };

  type PanelProps = {
    children?: React.ReactNode;
    className?: string;
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    size?: number;
    onResize?: (size: number) => void;
    id?: string;
    order?: number;
    [key: string]: unknown;
  };

  type PanelResizeHandleProps = {
    className?: string;
    children?: React.ReactNode;
    id?: string;
    onDragging?: (isDragging: boolean) => void;
    [key: string]: unknown;
  };

  export const PanelGroup: React.ComponentType<PanelGroupProps>;
  export const Panel: React.ComponentType<PanelProps>;
  export const PanelResizeHandle: React.ComponentType<PanelResizeHandleProps>;
}