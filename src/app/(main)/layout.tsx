import { getAllChapters } from '@/lib/chapters';
import { Sidebar } from '@/components/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const chapters = getAllChapters();

  return (
    <>
      <Sidebar chapters={chapters} />
      <main className="lg:ml-72">{children}</main>
    </>
  );
}
