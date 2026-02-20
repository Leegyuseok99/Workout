import WorkoutClient from "./WorkoutClient";

async function getExercises() {
  const res = await fetch(
    "https://wger.de/api/v2/exerciseinfo/?language=2&limit=10",
    { cache: "no-store" },
  );

  const data = await res.json();

  return data.results.map((item: any) => ({
    id: item.id,
    name:
      item.translations?.find((t: any) => t.language === 2)?.name ?? "Unknown",
    description:
      item.translations
        ?.find((t: any) => t.language === 2)
        ?.description?.replace(/<[^>]*>?/gm, "")
        .replace(/&nbsp;/g, " ")
        .trim() ?? "",
    images: Array.isArray(item.images)
      ? item.images.map((i: any) => i.image)
      : [],
    muscles: item.muscles?.map((m: any) => m.name_en).filter(Boolean) ?? [],
  }));
}

export default async function Page() {
  const exercises = await getExercises();

  return <WorkoutClient initialExercises={exercises} />;
}
