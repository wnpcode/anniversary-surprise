import { AnniversaryExperience } from "@/components/AnniversaryExperience";
import { getLatestAnniversary } from "@/lib/anniversaries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const edition = await getLatestAnniversary();
  if (!edition) throw new Error("No anniversary editions are available.");

  return <AnniversaryExperience edition={edition} />;
}
