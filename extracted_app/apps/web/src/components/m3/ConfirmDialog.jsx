import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ConfirmDialog = ({ open, onOpenChange, title, description, onConfirm, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-[9999] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl sm:max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-2 font-medium">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
          <AlertDialogCancel className="rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-colors">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={`rounded-xl font-bold border-none transition-colors ${
              isDestructive 
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600'
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;