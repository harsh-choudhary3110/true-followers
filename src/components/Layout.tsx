import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import InstallButton from './InstallButton';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <InstallButton />
    </div>
  );
}
