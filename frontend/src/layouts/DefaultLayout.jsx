import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '../components/common/ScrollToTop';

export default function DefaultLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
      <Header />
      <main className="grow">
        <ScrollToTop />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}