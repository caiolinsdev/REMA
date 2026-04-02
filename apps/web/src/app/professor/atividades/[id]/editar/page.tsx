import { ActivityEditor } from "@/modules/activities/ActivityEditor";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActivityEditor mode="edit" activityId={Number(id)} />;
}
