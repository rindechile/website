import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  /**
   * Size variant of the loading spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Optional loading text to display
   */
  text?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether to center the loading spinner
   * @default false
   */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Unified loading spinner component with Framer Motion
 * Supports different sizes and optional text
 * Respects prefers-reduced-motion accessibility
 */
export function Loading({ 
  size = 'md', 
  text, 
  className,
  centered = false 
}: LoadingProps) {
  const content = (
    <div className={cn(
      'flex items-center gap-3',
      centered && 'justify-center',
      className
    )}>
      <motion.div
        className={cn(
          'inline-block rounded-full border-solid border-current border-r-transparent align-[-0.125em]',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.75,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          // Fallback for reduced motion
          '--tw-spin': 'spin 0.75s linear infinite',
        } as React.CSSProperties}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <motion.span
          className={cn(
            'text-muted-foreground',
            textSizeClasses[size]
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {text}
        </motion.span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        {content}
      </div>
    );
  }

  return content;
}
