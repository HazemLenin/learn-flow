import * as React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-md border border-line bg-bg px-3 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-md border border-line bg-bg px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
