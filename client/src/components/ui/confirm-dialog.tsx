import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { Loader } from "./loader";

/**
 * EventKnit Confirm Dialog Component
 *
 * Beautiful, modern confirmation dialogs with variants for different scenarios.
 *
 * USAGE:
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Event?"
 *   description="This action cannot be undone."
 *   variant="danger"
 *   onConfirm={handleDelete}
 * />
 *
 * VARIANTS:
 * - info: Blue icon, for informational confirmations
 * - success: Green icon, for positive confirmations
 * - warning: Yellow icon, for cautionary actions
 * - danger: Red icon, for destructive actions
 */

type DialogVariant = "info" | "success" | "warning" | "danger";

const variantConfig: Record<
  DialogVariant,
  {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    confirmButton: string;
  }
> = {
  info: {
    icon: Info,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    confirmButton: "default",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-success-light",
    iconColor: "text-success",
    confirmButton: "success",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    confirmButton: "default",
  },
  danger: {
    icon: Trash2,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    confirmButton: "destructive",
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  variant = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  icon: CustomIcon,
  children,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirm action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const showLoading = loading || isLoading;

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        {/* Overlay with blur */}
        <AlertDialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />

        {/* Content */}
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]",
            "bg-card-surface border border-border rounded-2xl shadow-2xl",
            "p-0 overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "duration-200"
          )}
        >
          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute right-4 top-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content area */}
          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center",
                  config.iconBg
                )}
              >
                <Icon className={cn("w-7 h-7", config.iconColor)} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground mb-2">
                {title}
              </AlertDialogPrimitive.Title>
              {description && (
                <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </AlertDialogPrimitive.Description>
              )}
            </div>

            {/* Custom content */}
            {children && <div className="mb-6">{children}</div>}
          </div>

          {/* Footer with actions */}
          <div className="px-6 pb-6 flex gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                onClick={handleCancel}
                disabled={showLoading}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex-1"
                )}
              >
                {cancelText}
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button
                onClick={handleConfirm}
                disabled={showLoading}
                className={cn(
                  buttonVariants({
                    variant: config.confirmButton as "default" | "destructive" | "success",
                  }),
                  "flex-1"
                )}
              >
                {showLoading ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};

/**
 * Alert Dialog - Single-action dialog for informational alerts
 */
interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: DialogVariant;
  confirmText?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  variant = "info",
  confirmText = "OK",
  onConfirm,
  loading = false,
  icon: CustomIcon,
  children,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Alert action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showLoading = loading || isLoading;

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />

        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]",
            "bg-card-surface border border-border rounded-2xl shadow-2xl",
            "p-0 overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "duration-200"
          )}
        >
          <div className="p-6 pt-8">
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center",
                  config.iconBg
                )}
              >
                <Icon className={cn("w-7 h-7", config.iconColor)} />
              </div>
            </div>

            <div className="text-center mb-6">
              <AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground mb-2">
                {title}
              </AlertDialogPrimitive.Title>
              {description && (
                <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </AlertDialogPrimitive.Description>
              )}
            </div>

            {children && <div className="mb-6">{children}</div>}
          </div>

          <div className="px-6 pb-6">
            <AlertDialogPrimitive.Action asChild>
              <button
                onClick={handleConfirm}
                disabled={showLoading}
                className={cn(
                  buttonVariants({
                    variant: config.confirmButton as "default" | "destructive" | "success",
                  }),
                  "w-full"
                )}
              >
                {showLoading ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};

/**
 * Delete Confirm Dialog - Pre-configured for delete actions
 */
interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onOpenChange,
  itemName,
  itemType = "item",
  onConfirm,
  loading,
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    variant="danger"
    title={`Delete ${itemType}?`}
    description={
      itemName
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`
    }
    confirmText="Delete"
    onConfirm={onConfirm}
    loading={loading}
  />
);

/**
 * Unsaved Changes Dialog - For warning about leaving with unsaved changes
 */
interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    variant="warning"
    icon={AlertCircle}
    title="Unsaved Changes"
    description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
    confirmText="Leave"
    cancelText="Stay"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

/**
 * Success Dialog - For confirming successful actions
 */
interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Done",
  onConfirm,
}) => (
  <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        )}
      />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%]",
          "bg-card-surface border border-border rounded-2xl shadow-2xl p-6",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "duration-200"
        )}
      >
        {/* Success animation */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
          </div>
        </div>

        <div className="text-center mb-6">
          <AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground mb-2">
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          )}
        </div>

        <AlertDialogPrimitive.Action asChild>
          <button
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            {confirmText}
          </button>
        </AlertDialogPrimitive.Action>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  </AlertDialogPrimitive.Root>
);

export {
  AlertDialog,
  ConfirmDialog,
  DeleteDialog,
  UnsavedChangesDialog,
  SuccessDialog,
};
