"use client";

import React, { useCallback, useRef } from "react";
import { useController, FieldValues } from "react-hook-form";
import { X } from "lucide-react";
import { FileUploadFieldProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function FileUploader<T extends FieldValues>(
  props: FileUploadFieldProps<T>,
) {
  const {
    control,
    name,
    label,
    acceptTypes,
    disabled,
    icon: Icon,
    placeholder,
    hint,
  } = props;
  const {
    field: { onChange, value },
  } = useController({ name, control });

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = String(name);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onChange(file);
      }
    },
    [onChange],
  );

  const onRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onChange],
  );

  const isUploaded = !!value;

  return (
    <FormItem className="w-full">
      <FormLabel className="form-label" htmlFor={inputId}>
        {label}
      </FormLabel>
      <FormControl>
        <div
          className={cn(
            "upload-dropzone border-2 border-dashed border-[#8B7355]/20",
            isUploaded && "upload-dropzone-uploaded",
            disabled && "cursor-not-allowed opacity-50",
          )}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onKeyDown={(e) => {
            if (disabled) {
              return;
            }

            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            id={inputId}
            type="file"
            accept={acceptTypes.join(",")}
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
            disabled={disabled}
          />

          {isUploaded ? (
            <div className="flex flex-col items-center relative w-full px-4">
              <p className="upload-dropzone-text line-clamp-1">
                {(value as File).name}
              </p>
              <button
                type="button"
                onClick={onRemove}
                className="upload-dropzone-remove mt-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Icon className="upload-dropzone-icon" />
              <p className="upload-dropzone-text">{placeholder}</p>
              <p className="upload-dropzone-hint">{hint}</p>
            </>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
