declare module 'vaul' {
  import * as React from 'react';

  interface DrawerRootProps {
    shouldScaleBackground?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DrawerOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DrawerTitleProps extends React.HTMLAttributes<HTMLDivElement> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DrawerDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

  interface DrawerSubComponents {
    Root: React.FC<DrawerRootProps>;
    Trigger: React.FC<{ children?: React.ReactNode; asChild?: boolean }>;
    Portal: React.FC<{ children?: React.ReactNode }>;
    Close: React.FC<{ children?: React.ReactNode; asChild?: boolean }>;
    Overlay: React.ForwardRefExoticComponent<DrawerOverlayProps & React.RefAttributes<HTMLDivElement>>;
    Content: React.ForwardRefExoticComponent<DrawerContentProps & React.RefAttributes<HTMLDivElement>>;
    Title: React.ForwardRefExoticComponent<DrawerTitleProps & React.RefAttributes<HTMLDivElement>>;
    Description: React.ForwardRefExoticComponent<DrawerDescriptionProps & React.RefAttributes<HTMLDivElement>>;
  }

  export const Drawer: React.FC<DrawerRootProps> & DrawerSubComponents;
}
