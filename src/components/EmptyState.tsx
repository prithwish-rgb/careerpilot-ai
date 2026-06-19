import { LucideIcon } from "lucide-react";
import { EMPTY_STATE_CLASS } from "@/lib/modal-styles";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  helper,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  helper?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(EMPTY_STATE_CLASS, className)}>
      <Icon className="h-12 w-12 text-gray-400 mb-4" aria-hidden />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-2">{description}</p>
      {helper && (
        <p className="text-xs text-gray-500 dark:text-gray-500 max-w-md mb-4">{helper}</p>
      )}
      {action}
    </div>
  );
}
