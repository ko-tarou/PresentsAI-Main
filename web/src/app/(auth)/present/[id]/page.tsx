export default async function PresentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="flex h-screen items-center justify-center bg-black">
      <p className="text-white">Presenter [{id}] — coming in PR-023</p>
    </main>
  );
}
