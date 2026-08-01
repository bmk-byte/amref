export type AssetStatus = "draft" | "pending_consent" | "cleared" | "published" | "rejected";
export type StaffRole = "communications_manager" | "support_person";

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type ConsentRecord = {
  id: string;
  subject: string;
  consent_form_path: string | null;
  scope: string | null;
  date_signed: string | null;
  status: "active" | "revoked";
  created_by: string | null;
  created_at: string;
};

export type Asset = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  storage_path: string;
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

export const CATEGORIES_REQUIRING_CONSENT = ["human-interest-stories", "photos", "impact-series"];
