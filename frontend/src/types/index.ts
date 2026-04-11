export type HealthResponse = {
  status: string;
  service: string;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  full_name: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  user: User;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryListResponse = {
  items: Category[];
  total: number;
};

export type PaymentMethod = {
  id: number;
  user_id: number | null;
  label: string;
  provider: string;
  last4: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodListResponse = {
  items: PaymentMethod[];
  total: number;
};

export type DashboardSummaryStats = {
  total_monthly_spend: string;
  active_subscriptions: number;
  upcoming_renewals: number;
  cancelled_subscriptions: number;
};

export type DashboardMonthlySpendPoint = {
  month: string;
  label: string;
  total: string;
};

export type DashboardCategoryBreakdownItem = {
  category_id: number | null;
  category_name: string;
  subscriptions: number;
  total_monthly_spend: string;
};

export type DashboardUpcomingRenewalItem = {
  subscription_id: number;
  name: string;
  vendor: string;
  amount: string;
  currency: string;
  next_charge_date: string;
  days_until_charge: number;
};

export type DashboardRecentlyEndedItem = {
  subscription_id: number;
  name: string;
  vendor: string;
  amount: string;
  currency: string;
  end_date: string;
};

export type DashboardSummary = {
  summary: DashboardSummaryStats;
  monthly_spend: DashboardMonthlySpendPoint[];
  category_breakdown: DashboardCategoryBreakdownItem[];
  upcoming_renewals: DashboardUpcomingRenewalItem[];
  recently_ended: DashboardRecentlyEndedItem[];
};

export type DashboardWidgetId =
  | "monthly-spend"
  | "category-breakdown"
  | "upcoming-renewals"
  | "recently-ended";
export type DashboardLayoutColumn = "primary" | "secondary";

export type DashboardLayoutWidget = {
  id: DashboardWidgetId;
  column: DashboardLayoutColumn;
};

export type DashboardLayoutPayload = {
  widgets: DashboardLayoutWidget[];
};

export type DashboardLayout = DashboardLayoutPayload & {
  version: number;
  updated_at: string | null;
};

export type UploadSourceType = "upload_csv" | "upload_pdf";
export type UploadStatus = "queued" | "processing" | "completed" | "failed";

export type Upload = {
  id: number;
  file_name: string;
  source_type: UploadSourceType;
  provider: string;
  status: UploadStatus;
  content_type: string | null;
  file_size: number | null;
  error_message: string | null;
  transaction_count: number;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
};

export type UploadListResponse = {
  items: Upload[];
  total: number;
};

export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type SubscriptionCadence = "weekly" | "monthly" | "quarterly" | "yearly";

export type Subscription = {
  id: number;
  user_id: number;
  category_id: number | null;
  payment_method_id: number | null;
  name: string;
  vendor: string;
  description: string | null;
  website_url: string | null;
  amount: string;
  currency: string;
  cadence: string;
  status: string;
  start_date: string;
  end_date: string | null;
  next_charge_date: string | null;
  day_of_month: number | null;
  auto_renew: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionListResponse = {
  items: Subscription[];
  total: number;
  limit: number;
  offset: number;
};

export type SubscriptionFilters = {
  category_id?: number;
  limit?: number;
  offset?: number;
  payment_method_id?: number;
  search?: string;
  status?: string;
};

export type SubscriptionUpsertInput = {
  amount: string;
  auto_renew: boolean;
  cadence: string;
  category_id?: number;
  currency: string;
  day_of_month?: number;
  description?: string;
  end_date?: string;
  name: string;
  next_charge_date?: string;
  notes?: string;
  payment_method_id?: number;
  start_date: string;
  status: string;
  vendor: string;
  website_url?: string;
};
