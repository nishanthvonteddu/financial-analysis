export type HealthResponse = {
  status: string;
  service: string;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  preferred_currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserUpdateInput = {
  full_name?: string;
  preferred_currency?: string;
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

export type CategoryInput = {
  description?: string;
  name: string;
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

export type PaymentMethodInput = {
  is_default: boolean;
  label: string;
  last4?: string;
  provider: string;
};

export type DashboardSummaryStats = {
  total_monthly_spend: string;
  currency: string;
  active_subscriptions: number;
  upcoming_renewals: number;
  cancelled_subscriptions: number;
};

export type DashboardMonthlySpendPoint = {
  month: string;
  label: string;
  total: string;
  currency: string;
};

export type DashboardActiveSubscriptionItem = {
  subscription_id: number;
  name: string;
  vendor: string;
  amount: string;
  currency: string;
  cadence: string;
  category_name: string;
  next_charge_date: string | null;
};

export type DashboardCategoryBreakdownItem = {
  category_id: number | null;
  category_name: string;
  subscriptions: number;
  total_monthly_spend: string;
  currency: string;
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
  active_subscriptions: DashboardActiveSubscriptionItem[];
  monthly_spend: DashboardMonthlySpendPoint[];
  category_breakdown: DashboardCategoryBreakdownItem[];
  upcoming_renewals: DashboardUpcomingRenewalItem[];
  recently_ended: DashboardRecentlyEndedItem[];
};

export type DashboardWidgetId =
  | "active-subscriptions"
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

export type ExpenseReportCategoryBreakdownItem = {
  category_name: string;
  total_amount: string;
  transaction_count: number;
};

export type ExpenseReportMerchantBreakdownItem = {
  merchant: string;
  total_amount: string;
  transaction_count: number;
};

export type ExpenseReportTimelinePoint = {
  period_start: string;
  label: string;
  total_amount: string;
};

export type ExpenseReportSummary = {
  upload_name: string | null;
  provider: string | null;
  transaction_count: number;
  recurring_transaction_count: number;
  merchant_count: number;
  average_transaction: string;
  largest_transaction: string;
  category_breakdown: ExpenseReportCategoryBreakdownItem[];
  top_merchants: ExpenseReportMerchantBreakdownItem[];
  spend_timeline: ExpenseReportTimelinePoint[];
};

export type ExpenseReport = {
  id: number;
  user_id: number;
  data_source_id: number | null;
  period_start: string;
  period_end: string;
  currency: string;
  total_amount: string;
  report_status: string;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
  summary: ExpenseReportSummary;
};

export type ExpenseReportListResponse = {
  items: ExpenseReport[];
  total: number;
};

export type AnalyticsRangeKey = "90d" | "180d" | "365d";

export type AnalyticsWindow = {
  key: AnalyticsRangeKey;
  label: string;
  start_date: string;
  end_date: string;
};

export type AnalyticsSummary = {
  total_spend: string;
  average_monthly_spend: string;
  currency: string;
  active_subscriptions: number;
  projected_monthly_savings: string;
  projected_range_savings: string;
};

export type AnalyticsCategoryItem = {
  category_id: number | null;
  category_name: string;
  total_spend: string;
  currency: string;
  active_subscriptions: number;
  projected_monthly_savings: string;
  projected_range_savings: string;
};

export type AnalyticsPaymentMethodItem = {
  payment_method_id: number | null;
  payment_method_label: string;
  provider: string | null;
  total_spend: string;
  currency: string;
  active_subscriptions: number;
};

export type AnalyticsFrequencyItem = {
  cadence: string;
  label: string;
  subscription_count: number;
  monthly_equivalent: string;
  currency: string;
};

export type AnalyticsTrendCategoryItem = {
  category_name: string;
  total_spend: string;
  currency: string;
};

export type AnalyticsTrendPoint = {
  period_start: string;
  label: string;
  total_spend: string;
  currency: string;
  category_totals: AnalyticsTrendCategoryItem[];
};

export type SupportedCurrency = {
  code: string;
  name: string;
};

export type SupportedCurrencyListResponse = {
  items: SupportedCurrency[];
};

export type ExpenseAnalytics = {
  window: AnalyticsWindow;
  summary: AnalyticsSummary;
  categories: AnalyticsCategoryItem[];
  payment_methods: AnalyticsPaymentMethodItem[];
  frequency_distribution: AnalyticsFrequencyItem[];
  trends: AnalyticsTrendPoint[];
  trend_categories: string[];
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

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  status: "read" | "unread";
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  unread_count: number;
  total: number;
};

export type NotificationChannel = "email" | "telegram";
export type NotificationEventType = "renewal_due";

export type NotificationPreference = {
  channel: NotificationChannel;
  event_type: NotificationEventType;
  is_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
};

export type NotificationPreferencesResponse = {
  items: NotificationPreference[];
  telegram_linked: boolean;
};

export type NotificationPreferencesUpdate = {
  items: NotificationPreference[];
};

export type TelegramLinkTokenResponse = {
  token: string;
  deep_link_hint: string;
};

export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type SubscriptionCadence = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubscriptionRenewalState = "inactive" | "overdue" | "scheduled" | "trialing";

export type SubscriptionRenewal = {
  state: SubscriptionRenewalState;
  last_renewed_at: string | null;
  next_charge_date: string | null;
  days_until_charge: number | null;
  days_overdue: number | null;
  trial_ends_at: string | null;
  trial_days_remaining: number | null;
};

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
  renewal: SubscriptionRenewal;
  created_at: string;
  updated_at: string;
};

export type SubscriptionListResponse = {
  items: Subscription[];
  total: number;
  limit: number;
  offset: number;
};

export type SubscriptionPaymentHistoryItem = {
  id: number;
  payment_method_id: number | null;
  payment_method_label: string | null;
  paid_at: string;
  amount: string;
  currency: string;
  payment_status: string;
  reference: string | null;
};

export type SubscriptionPriceChange = {
  id: number;
  effective_date: string;
  previous_amount: string;
  new_amount: string;
  currency: string;
  note: string | null;
};

export type SubscriptionPaymentHistorySummary = {
  payment_count: number;
  total_paid: string;
  average_payment: string;
  latest_payment_amount: string | null;
  latest_payment_at: string | null;
  first_payment_at: string | null;
  price_change_count: number;
};

export type SubscriptionPaymentHistory = {
  subscription_id: number;
  subscription_name: string;
  summary: SubscriptionPaymentHistorySummary;
  items: SubscriptionPaymentHistoryItem[];
  price_changes: SubscriptionPriceChange[];
};

export type SubscriptionFilters = {
  cadence?: string;
  category_id?: number;
  limit?: number;
  max_amount?: number;
  min_amount?: number;
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

export type CalendarRenewalItem = {
  subscription_id: number;
  name: string;
  vendor: string;
  amount: string;
  currency: string;
  cadence: string;
  status: string;
  renewal_date: string;
  category_id: number | null;
  category_name: string;
  payment_method_id: number | null;
  payment_method_label: string | null;
};

export type CalendarDay = {
  date: string;
  day: number;
  total_amount: string;
  renewals: CalendarRenewalItem[];
};

export type CalendarRenewalResponse = {
  year: number;
  month: number;
  period_start: string;
  period_end: string;
  total_renewals: number;
  days: CalendarDay[];
};
