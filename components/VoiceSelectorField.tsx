"use client";

import { ControllerRenderProps, FieldValues, Path, UseFormReturn } from "react-hook-form";
import { voiceCategories, voiceOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface VoiceSelectorFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  disabled?: boolean;
}

const voiceGroups = [
  { label: "Male Voices", keys: voiceCategories.male },
  { label: "Female Voices", keys: voiceCategories.female },
] as const;

export function VoiceSelectorField<T extends FieldValues>({
  form,
  name,
  disabled,
}: VoiceSelectorFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
          <FormControl>
            <div className="space-y-6">
              {voiceGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    {group.label}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.keys.map((voiceKey) => {
                      const voice = voiceOptions[voiceKey as keyof typeof voiceOptions];

                      return (
                        <VoiceOption
                          key={voice.id}
                          field={field}
                          disabled={disabled}
                          description={voice.description}
                          id={voice.id}
                          label={voice.name}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface VoiceOptionProps<T extends FieldValues> {
  field: ControllerRenderProps<T, Path<T>>;
  disabled?: boolean;
  description: string;
  id: string;
  label: string;
}

function VoiceOption<T extends FieldValues>({
  field,
  disabled,
  description,
  id,
  label,
}: VoiceOptionProps<T>) {
  const isSelected = field.value === id;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => field.onChange(id)}
      className={cn(
        "voice-selector-option text-left",
        isSelected
          ? "voice-selector-option-selected"
          : "voice-selector-option-default",
        disabled && "voice-selector-option-disabled",
      )}
    >
      <input
        type="radio"
        name={field.name}
        value={id}
        checked={isSelected}
        onChange={() => field.onChange(id)}
        className="sr-only"
      />
      <div className="space-y-1">
        <p className="font-serif text-lg font-semibold text-[var(--text-primary)]">
          {label}
        </p>
        <p className="text-sm leading-5 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </button>
  );
}
