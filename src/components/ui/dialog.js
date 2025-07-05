import * as React from "react";
import { cn } from "@/lib/utils";

const DialogContext = React.createContext();

const Dialog = ({ children, open, onOpenChange, ...props }) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  
  const handleOpenChange = (newOpen) => {
    if (open === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => handleOpenChange(false)}
          />
        </div>
      )}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => context?.onOpenChange?.(true),
      ...props
    });
  }
  
  return (
    <button
      ref={ref}
      className={className}
      onClick={() => context?.onOpenChange?.(true)}
      {...props}
    >
      {children}
    </button>
  );
});
DialogTrigger.displayName = "DialogTrigger";

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  
  if (!context?.isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => context?.onOpenChange?.(false)}
      />
      <div
        ref={ref}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => context?.onOpenChange?.(false)}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
});
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle };