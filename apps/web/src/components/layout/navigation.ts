// Enlaces del menú principal. El Spec #3 mostrará "Mis reservas" / "Ingresar"
// según la sesión y agregará "Administración" para el rol ADMIN.
export const MAIN_NAV = [
  { to: '/cartelera', label: 'Cartelera' },
  { to: '/artistas', label: 'Artistas' },
  { to: '/escenarios', label: 'Escenarios' },
  { to: '/mis-reservas', label: 'Mis reservas' },
] as const;
