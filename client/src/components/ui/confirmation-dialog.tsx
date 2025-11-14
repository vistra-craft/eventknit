import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmationType = "danger" | "warning" | "info" | "success";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  loading?: boolean;
  children?: React.ReactNode;
}

const ConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  loading = false,
  children,
}: ConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "danger":
        return "bg-red-100";
      case "warning":
        return "bg-yellow-100";
      case "info":
        return "bg-blue-100";
      case "success":
        return "bg-green-100";
      default:
        return "bg-yellow-100";
    }
  };

  const getConfirmVariant = () => {
    switch (type) {
      case "danger":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "default";
      case "success":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0", getIconBg())}>
              {getIcon()}
            </div>
            <div className="flex-1 space-y-2">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        {children && <div className="py-4">{children}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              type === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              type === "warning" && "bg-yellow-600 text-white hover:bg-yellow-700",
              type === "info" && "bg-blue-600 text-white hover:bg-blue-700",
              type === "success" && "bg-green-600 text-white hover:bg-green-700"
            )}
          >
            {loading ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ConfirmationDialog };

