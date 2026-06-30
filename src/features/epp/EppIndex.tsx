import { Backpack, PackageCheck } from 'lucide-react';
import { SectionIndex } from '@/components/common/SectionIndex';

export function Component() {
  return (
    <SectionIndex
      title="EPP / SPDC"
      subtitle="Entregas de EPP y mochilas SPDC"
      items={[
        { to: '/entrega-epp', label: 'Entregas EPP', desc: 'Entregas de equipo de protección', icon: PackageCheck },
        { to: '/mochila-spdc', label: 'Mochilas SPDC', desc: 'Mochilas y sus inspecciones', icon: Backpack },
      ]}
    />
  );
}
