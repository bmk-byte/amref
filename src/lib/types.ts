export type AssetStatus = "draft" | "pending_consent" | "cleared" | "published" | "rejected";
export type StaffRole = "communications_manager" | "support_person";

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type Asset = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  storage_path: string | null;
  source_url: string | null;
  thumbnail_path: string | null;
  file_type: string | null;
  credit: string | null;
  tags: string[];
  consent_id: string | null;
  status: AssetStatus;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: StaffRole;
  created_at: string;
};
