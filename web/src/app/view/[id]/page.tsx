export default async function ViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="flex h-screen items-center justify-center bg-black">
      <p className="text-white">Viewer [{id}] — coming in PR-024</p>
    </main>
  );
}
