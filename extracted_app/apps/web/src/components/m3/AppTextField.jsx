import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

const AppTextField = forwardRef(({ 
  label, 
  error, 
  helperText, 
  prefix: PrefixIcon, 
  suffix: SuffixIcon, 
  className,
  id,
  type = "text",
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            "text-[14px] font-semibold transition-colors duration-200",
            error ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative w-full">
        {PrefixIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999999] z-10">
            <PrefixIcon className="w-5 h-5" />
          </div>
        )}
        
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            id={inputId}
            className={cn(
              "flex min-h-[100px] w-full rounded-[12px] border border-transparent bg-[#F5F6F8] px-4 py-3 text-[14px] text-foreground placeholder:text-[#999999] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all",
              error ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive" : "",
              PrefixIcon ? "pl-11" : "",
              SuffixIcon ? "pr-11" : ""
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "flex h-[48px] w-full rounded-[12px] border border-transparent bg-[#F5F6F8] px-4 py-2 text-[14px] text-foreground placeholder:text-[#999999] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all",
              error ? "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive" : "",
              PrefixIcon ? "pl-11" : "",
              SuffixIcon ? "pr-11" : ""
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        )}

        {SuffixIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] z-10">
            <SuffixIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <span className={cn("text-[12px] px-1 transition-colors duration-200", error ? "text-destructive" : "text-muted-foreground")}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

AppTextField.displayName = 'AppTextField';
export default AppTextField;