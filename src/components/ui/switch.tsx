"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

function Switch({ checked = false, onCheckedChange, className, disabled, ...props }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            data-state={checked ? "checked" : "unchecked"}
            disabled={disabled}
            onClick={(event) => {
                if (disabled) return;
                onCheckedChange?.(!checked);
                props.onClick?.(event);
            }}
            className={cn(
                "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-input bg-input/50 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
                className
            )}
            {...props}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-xs ring-0 transition-transform",
                    checked ? "translate-x-4" : "translate-x-0"
                )}
            />
        </button>
    );
}

export { Switch };
