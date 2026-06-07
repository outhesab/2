import * as MenubarPrimitive from '@radix-ui/react-menubar';

import { cva } from 'class-variance-authority';

// Simple menu view model component using radix menubar
export default function MenuViewModel() {
  return (
    <MenubarPrimitive.Root className="flex space-x-2 border-b border-border bg-background p-2">
      <MenubarPrimitive.Menu>
        <MenubarPrimitive.Trigger className={triggerStyle()}>Dosya</MenubarPrimitive.Trigger>
        <MenubarPrimitive.Content className={contentStyle()}>
          <MenubarPrimitive.Item className={itemStyle()}>Yeni</MenubarPrimitive.Item>
          <MenubarPrimitive.Item className={itemStyle()}>Aç</MenubarPrimitive.Item>
          <MenubarPrimitive.Separator className="my-1 h-px bg-border" />
          <MenubarPrimitive.Item className={itemStyle()}>Çıkış</MenubarPrimitive.Item>
        </MenubarPrimitive.Content>
      </MenubarPrimitive.Menu>
      <MenubarPrimitive.Menu>
        <MenubarPrimitive.Trigger className={triggerStyle()}>Düzen</MenubarPrimitive.Trigger>
        <MenubarPrimitive.Content className={contentStyle()}>
          <MenubarPrimitive.Item className={itemStyle()}>Geri Al</MenubarPrimitive.Item>
          <MenubarPrimitive.Item className={itemStyle()}>Yinele</MenubarPrimitive.Item>
        </MenubarPrimitive.Content>
      </MenubarPrimitive.Menu>
    </MenubarPrimitive.Root>
  );
}

const triggerStyle = cva(
  'flex items-center px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
  {
    variants: {},
    defaultVariants: {},
  },
);

const contentStyle = cva('min-w-[8rem] bg-popover text-popover-foreground rounded-md shadow-md p-1', {
  variants: {},
  defaultVariants: {},
});

const itemStyle = cva(
  'flex items-center px-2 py-1 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground',
  {
    variants: {},
    defaultVariants: {},
  },
);
