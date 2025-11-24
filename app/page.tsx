'use client';

import { MapProvider } from "./contexts/MapContext";
import { ClientPageContent } from "./components/ClientPageContent";

export default function Home() {
  return (
    <MapProvider>
      <ClientPageContent />
    </MapProvider>
  );
}
 