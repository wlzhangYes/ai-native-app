// MSW Browser Worker Setup
// This file sets up Mock Service Worker for the browser

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create and export the worker
export const worker = setupWorker(...handlers);
