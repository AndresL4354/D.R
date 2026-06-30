import { Bed, CalendarDays, Plane } from 'lucide-react';
import { SectionIndex } from '@/components/common/SectionIndex';

export function Component() {
  return (
    <SectionIndex
      title="Logística"
      subtitle="Pasajes, hospedajes y citaciones"
      items={[
        { to: '/pasaje', label: 'Pasajes', desc: 'Pasajes de trabajadores', icon: Plane },
        { to: '/hospedaje', label: 'Hospedajes', desc: 'Hospedajes asignados', icon: Bed },
        { to: '/citacion', label: 'Citaciones', desc: 'Citaciones registradas', icon: CalendarDays },
      ]}
    />
  );
}
