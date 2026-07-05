import { prisma } from "@/lib/prisma";
import CategoryManager from "@/components/CategoryManager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Categories</h2>
      <CategoryManager categories={categories} />
    </div>
  );
}
