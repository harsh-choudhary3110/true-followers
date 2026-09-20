import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './App';
import './fonts.css';
import './index.css';

// vite-react-ssg drives the router (client hydration + static prerender).
export const createRoot = ViteReactSSG({ routes });
