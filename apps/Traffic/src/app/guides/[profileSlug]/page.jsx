import { notFound, permanentRedirect } from "next/navigation";
import {
  getAllPublicContentSlugsForStaticGeneration,
  getPublicContentPageBySlug,
} from "@/data/repositories/content.repo";
import { contentGuideCanonicalPath } from "@/lib/paths";

export async function generateStaticParams() {
  const slugs = await getAllPublicContentSlugsForStaticGeneration();
  return slugs.map((slug) => ({ profileSlug: slug }));
}

export default async function LegacyGuideSlugPage({ params }) {
  const page = await getPublicContentPageBySlug(params.profileSlug);
  if (!page) {
    notFound();
  }

  if (!page.profileSlug) {
    notFound();
  }

  permanentRedirect(contentGuideCanonicalPath(page.profileSlug, page.slug));
}
