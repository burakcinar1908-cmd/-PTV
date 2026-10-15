import Oynatici from "@/components/kanal/Oynatici";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Oynatici id={id} />;
}
