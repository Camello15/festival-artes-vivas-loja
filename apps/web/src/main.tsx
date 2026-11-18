import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import '@fontsource/big-shoulders-display/700';
import '@fontsource/big-shoulders-display/900';
import '@fontsource/atkinson-hyperlegible/400';
import '@fontsource/atkinson-hyperlegible/700';
import './index.css';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
