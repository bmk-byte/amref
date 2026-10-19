import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import AddResourceView from "./add-resource-view";

export default async function AddResourcePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return <AddResourceView categories={(categories ?? []) as Category[]} />;
}
