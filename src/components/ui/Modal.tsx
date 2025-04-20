import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { XMarkIcon } from "@heroicons/react/24/solid";
import React, { useEffect, useState } from "react";
import type { MouseEventHandler } from "react";
import ReactDOM from "react-dom";

export function Modal({
  element,
  children,
  className = "",
  defaultOpen = false,
  canBeClosed = true,
  closeOnBackClick = false,
  onClose = () => {},
}: {
  element: React.ReactElement<unknown, string | React.JSXElementConstructor<any>>,
  children?: React.ReactNode,
  className?: string,
  defaultOpen?: boolean,
  canBeClosed?: boolean,
  closeOnBackClick?: boolean,
  onClose?: MouseEventHandler<HTMLElement> | undefined,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const modalContent = (
    <div
      className="fixed z-50 left-0 top-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center"
      onClick={(e) => {
        e.preventDefault();
        if (!closeOnBackClick) return;
        setOpen(false);
        onClose(e);
      }}
    >
      <Card
        className={`relative min-w-72 mx-5 sm:mx-10 outline-1 outline-gray-300 dark:outline-gray-700 inline-block duration-100 delay-300 transition-all ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {canBeClosed && (
          <Button
            className="absolute top-4 right-4"
            variant="none"
            onClick={(e) => {
              setOpen(false);
              onClose(e);
            }}
          >
            <XMarkIcon className="w-6 h-6" />
          </Button>
        )}
        {children}
      </Card>
    </div>
  );

  if (!open) {
    return React.cloneElement(element, {
      onClick: (e) => {
        setOpen(true);
        onClose(e);
      },
    } as React.HTMLAttributes<HTMLElement>);
  }

  return mounted && typeof window !== "undefined"
    ? ReactDOM.createPortal(modalContent, document.getElementById("modal-root")!)
    : null;
}
