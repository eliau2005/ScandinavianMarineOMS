import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  confirmationString?: string;
  confirmButtonClass?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  confirmationString,
  confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
}) => {
  const [input, setInput] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(!confirmationString);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setIsConfirmed(!confirmationString);
    }
  }, [isOpen, confirmationString]);

  useEffect(() => {
    if (confirmationString) {
      setIsConfirmed(input === confirmationString);
    }
  }, [input, confirmationString]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
            {message}
          </div>

          {confirmationString && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                To confirm, type "<strong>{confirmationString}</strong>" in the box below
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isConfirming}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming || !isConfirmed}
            className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isConfirmed ? confirmButtonClass : 'bg-gray-400 dark:bg-gray-600'
            }`}
          >
            {isConfirming ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
