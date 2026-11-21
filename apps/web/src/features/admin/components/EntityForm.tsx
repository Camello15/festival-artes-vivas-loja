import { useState, type FormEvent } from 'react';

export interface EntityFormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'url' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select' | 'multiselect';
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
}

export type EntityFormValues = Record<string, string>;

interface EntityFormProps {
  fields: EntityFormField[];
  initialValues?: EntityFormValues;
  errors?: Record<string, string>;
  submitLabel?: string;
  busy?: boolean;
  onSubmit: (values: EntityFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export function EntityForm({
  fields,
  initialValues = {},
  errors = {},
  submitLabel = 'Guardar',
  busy = false,
  onSubmit,
  onCancel,
}: EntityFormProps) {
  const [values, setValues] = useState<EntityFormValues>(() => Object.fromEntries(
    fields.map((field) => [field.name, initialValues[field.name] ?? '']),
  ));
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setValidationErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const control = form.elements.namedItem(field.name);
      if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) continue;
      if (!control.validity.valid) {
        nextErrors[field.name] = control.validity.valueMissing
          ? 'Completa este campo.'
          : control.validity.typeMismatch
            ? 'Ingresa un valor válido.'
            : control.validationMessage || 'Revisa este campo.';
      }
    }

    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = fields.find((field) => nextErrors[field.name]);
      const firstInvalidControl = firstInvalidField && form.elements.namedItem(firstInvalidField.name);
      if (firstInvalidControl instanceof HTMLElement) firstInvalidControl.focus();
      return;
    }

    await onSubmit(values);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => {
        const error = validationErrors[field.name] || errors[field.name];
        const errorId = `${field.name}-error`;
        const commonProps = {
          id: field.name,
          name: field.name,
          required: field.required,
          value: values[field.name] ?? '',
          'aria-invalid': Boolean(error),
          'aria-describedby': error ? errorId : undefined,
          onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            updateValue(field.name, event.currentTarget.value);
          },
          className: 'mt-1 w-full rounded border border-line bg-white px-3 py-2 text-ink',
        };

        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block font-bold">
              {field.label}{field.required && <span aria-hidden="true"> *</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea {...commonProps} placeholder={field.placeholder} />
            ) : field.type === 'multiselect' ? (
              <select
                {...commonProps}
                multiple
                value={(values[field.name] ?? '').split(',').filter(Boolean)}
                onChange={(event) => updateValue(
                  field.name,
                  Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(','),
                )}
              >
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : field.type === 'select' ? (
              <select {...commonProps}>
                <option value="">Selecciona una opción</option>
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <input
                {...commonProps}
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
              />
            )}
            {error && <p id={errorId} role="alert" className="mt-1 font-bold text-theater">{error}</p>}
          </div>
        );
      })}
      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={busy} className="rounded border border-ink px-4 py-2 font-bold text-ink disabled:opacity-60">
          Cancelar
        </button>
        <button type="submit" disabled={busy} className="rounded bg-marigold px-4 py-2 font-bold text-ink disabled:opacity-60">
          {busy ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
