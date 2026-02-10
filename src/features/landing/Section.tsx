import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'textured';
}) => (
  <div className={cn(
    'relative overflow-hidden px-3 py-16',
    props.variant === 'textured' && 'bg-background bg-mesh',
    props.className,
  )}
  >
    {props.variant === 'textured' && (
      <div className="noise absolute inset-0 z-0 opacity-[0.02]" />
    )}

    <div className="relative z-10 mx-auto max-w-screen-lg">
      {(props.title || props.subtitle || props.description) && (
        <div className="mx-auto mb-12 max-w-screen-md text-center">
          {props.subtitle && (
            <div className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">
              {props.subtitle}
            </div>
          )}

          {props.title && (
            <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {props.title}
            </h2>
          )}

          {props.description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {props.description}
            </p>
          )}
        </div>
      )}

      {props.children}
    </div>
  </div>
);
