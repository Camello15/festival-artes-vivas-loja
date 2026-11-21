import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../features/admin/components/ConfirmDialog';
import { DataTable } from '../features/admin/components/DataTable';
import { EntityForm } from '../features/admin/components/EntityForm';

describe('DataTable', () => {
  it('muestra columnas y acciones configurables por fila', () => {
    render(
      <DataTable
        ariaLabel="Escenarios"
        rows={[{ id: 3, name: 'Teatro Loja' }]}
        getRowKey={(row) => row.id}
        columns={[{ key: 'name', header: 'Nombre', render: (row) => row.name }]}
        renderActions={(row) => <button type="button">Editar {row.name}</button>}
      />,
    );

    expect(screen.getByRole('table', { name: 'Escenarios' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Teatro Loja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar Teatro Loja' })).toBeInTheDocument();
  });

  it('presenta el estado vacío configurado', () => {
    render(
      <DataTable ariaLabel="Escenarios" rows={[]} getRowKey={(row: { id: number }) => row.id}
        columns={[]} emptyMessage="No hay escenarios todavía." />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('No hay escenarios todavía.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('EntityForm', () => {
  it('valida campos requeridos, asocia el error y enfoca el primer campo inválido', async () => {
    const actor = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EntityForm
        fields={[{ name: 'name', label: 'Nombre', required: true }, { name: 'email', label: 'Correo', type: 'email', required: true }]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    await actor.click(screen.getByRole('button', { name: 'Guardar' }));
    const nameField = screen.getByRole('textbox', { name: 'Nombre' });
    expect(nameField).toHaveFocus();
    expect(nameField).toHaveAttribute('aria-invalid', 'true');
    expect(nameField).toHaveAttribute('aria-describedby', 'name-error');
    expect(document.getElementById('name-error')).toHaveTextContent('Completa este campo.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía los valores y permite cancelar', async () => {
    const actor = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(
      <EntityForm fields={[{ name: 'name', label: 'Nombre', required: true }]} initialValues={{ name: 'Teatro Loja' }}
        onSubmit={onSubmit} onCancel={onCancel} />,
    );

    await actor.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Teatro Loja' });
    await actor.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('ConfirmDialog compartido', () => {
  it('expone el diálogo existente a través del módulo admin', async () => {
    const actor = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog title="Confirmar cambio" description="¿Continuar?" confirmLabel="Sí, continuar"
      onConfirm={onConfirm} onCancel={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Confirmar cambio' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Sí, continuar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
