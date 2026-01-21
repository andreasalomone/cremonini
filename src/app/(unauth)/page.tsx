import { Footer } from '@/templates/Footer';
import { Hero } from '@/templates/Hero';
import { Navbar } from '@/templates/Navbar';

export const metadata = {
  title: 'Cremonini - Piattaforma Gestione Sinistri S&A',
  description: 'Piattaforma centralizzata per la gestione dei sinistri del Gruppo Cremonini.',
};

const IndexPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center">
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default IndexPage;
