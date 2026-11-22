import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
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

  it('enfoca el primer control al abrir y el primer campo con error del servidor', () => {
    render(
      <EntityForm
        fields={[{ name: 'name', label: 'Nombre' }, { name: 'email', label: 'Correo' }]}
        errors={{ email: 'Ese correo ya está registrado.' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const emailField = screen.getByRole('textbox', { name: 'Correo' });
    expect(emailField).toHaveFocus();
    expect(emailField).toHaveAttribute('aria-invalid', 'true');
    expect(emailField).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('anuncia el guardado mientras el formulario está ocupado', () => {
    render(
      <EntityForm
        fields={[{ name: 'name', label: 'Nombre' }]}
        busy
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('form', { name: 'Guardar' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Guardando cambios');
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

  it('permite seleccionar varias opciones y las conserva como valores separados', async () => {
    const actor = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EntityForm
        fields={[{
          name: 'artistIds',
          label: 'Artistas',
          type: 'multiselect',
          description: 'Usa las flechas y la barra espaciadora.',
          options: [{ value: '12', label: 'Compañía Loja' }, { value: '21', label: 'Dúo Andino' }],
        }]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    const artists = screen.getByRole('listbox', { name: 'Artistas' });
    expect(artists).toHaveAttribute('aria-describedby', 'artistIds-description');
    expect(screen.getByText('Usa las flechas y la barra espaciadora.')).toBeInTheDocument();
    await actor.selectOptions(artists, ['12', '21']);
    await actor.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith({ artistIds: '12,21' });
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

  it('inicia el foco dentro del diálogo, lo mantiene con Tab y lo devuelve al cerrarlo', async () => {
    const actor = userEvent.setup();

    function DialogHarness() {
      const [open, setOpen] = useState(false);
      const headingRef = useRef<HTMLHeadingElement>(null);
      return (
        <>
          <h1 ref={headingRef} tabIndex={-1}>Administración</h1>
          <button type="button" onClick={() => setOpen(true)}>Abrir confirmación</button>
          {open && (
            <ConfirmDialog
              title="Confirmar cambio"
              description="¿Continuar?"
              confirmLabel="Sí, continuar"
              fallbackFocusRef={headingRef}
              onConfirm={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          )}
        </>
      );
    }

    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Abrir confirmación' });
    await actor.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Confirmar cambio' });
    const cancel = screen.getByRole('button', { name: 'Volver' });
    const confirm = screen.getByRole('button', { name: 'Sí, continuar' });
    expect(cancel).toHaveFocus();
    await actor.tab();
    expect(confirm).toHaveFocus();
    await actor.tab();
    expect(cancel).toHaveFocus();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    await actor.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('mantiene el foco en el diálogo y anuncia la operación mientras está ocupado', () => {
    render(<ConfirmDialog title="Confirmar cambio" description="¿Continuar?" confirmLabel="Sí, continuar"
      busy onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('dialog')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Procesando la solicitud');
  });
});
