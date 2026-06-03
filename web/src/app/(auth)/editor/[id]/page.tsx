export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="flex h-screen flex-col bg-gray-100">
      <p className="m-auto text-gray-500">Editor [{id}] — coming in PR-006</p>
    </main>
  );
}
