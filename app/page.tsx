import MapContainerSuspense from "./components/map/MapContainerSuspense";

export default function Home() {
  return (
    <main className="w-full h-screen">
      <section className="flex flex-col tablet:flex-row w-full gap-8">
        <MapContainerSuspense />

        <div className="bg-card w-3/5 rounded-sm">
        </div>

      </section>
    </main>
  );
}
 