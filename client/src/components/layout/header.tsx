import { ReactNode } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export default function Header({ title, subtitle, actions, className }: HeaderProps) {
  const [location] = useLocation();
  const currentTime = format(new Date(), "MMMM d, yyyy hh:mm a");
  
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6",
      className
    )}>
      <div>
        <h2 className="text-2xl font-bold text-neutral-400">{title}</h2>
        {subtitle && <p className="text-neutral-300 mt-1">{subtitle}</p>}
      </div>
      
      <div className="mt-2 sm:mt-0 flex items-center">
        {actions ? (
          actions
        ) : (
          <span className="text-xs text-neutral-300">Last updated: {currentTime}</span>
        )}
      </div>
    </div>
  );
}
