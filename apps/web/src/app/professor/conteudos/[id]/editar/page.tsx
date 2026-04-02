import { ContentEditor } from "@/modules/contents/ContentEditor";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentEditor mode="edit" contentId={Number(id)} />;
}
