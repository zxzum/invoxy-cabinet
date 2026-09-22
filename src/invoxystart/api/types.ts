export interface User {
  id: number;
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  email_verified: boolean;
  balance_kopeks: number;
  balance_rubles: number;
  referral_code: string | null;
  language: string;
  created_at: string;
  auth_type: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterResponse {
  message: string;
  email?: string;
  requires_verification?: boolean;
  merge_required?: boolean;
  merge_verification?: 'email_code';
  merge_token?: string | null;
}

export interface OAuthProvider {
  name: string;
  display_name: string;
}

export interface SubscriptionServer {
  uuid: string;
  name: string;
  country_code: string | null;
}

export interface TrafficPurchase {
  id: number;
  traffic_gb: number;
  expires_at: string;
  created_at: string;
  days_remaining: number;
  progress_percent: number;
}

export interface Subscription {
  id: number;
  status: string;
  is_trial: boolean;
  start_date: string;
  end_date: string;
  days_left: number;
  hours_left: number;
  minutes_left: number;
  time_left_display: string;
  traffic_limit_gb: number;
  traffic_used_gb: number;
  traffic_used_percent: number;
  whitelist_traffic_limit_gb?: number;
  whitelist_traffic_used_gb?: number;
  whitelist_traffic_used_percent?: number;
  whitelist_traffic_purchases?: TrafficPurchase[];
  device_limit: number;
  connected_squads: string[];
  servers: SubscriptionServer[];
  autopay_enabled: boolean;
  autopay_days_before: number;
  subscription_url: string | null;
  subscription_crypto_link?: string | null;
  hide_subscription_link: boolean;
  is_active: boolean;
  is_expired: boolean;
  is_limited: boolean;
  traffic_purchases?: TrafficPurchase[];
  is_daily?: boolean;
  is_daily_paused?: boolean;
  daily_price_kopeks?: number;
  next_daily_charge_at?: string;
  tariff_id?: number;
  tariff_name?: string;
  traffic_reset_mode?: string;
}

export interface SubscriptionStatusResponse {
  has_subscription: boolean;
  subscription: Subscription | null;
}

export interface SubscriptionListItem {
  id: number;
  status: string;
  tariff_id: number | null;
  tariff_name: string | null;
  traffic_limit_gb: number;
  traffic_used_gb: number;
  device_limit: number;
  end_date: string | null;
  subscription_url: string | null;
  subscription_crypto_link: string | null;
  is_trial: boolean;
  is_daily?: boolean;
  is_daily_paused?: boolean;
  autopay_enabled: boolean;
  connected_squads: string[] | null;
  whitelist_traffic_limit_gb?: number;
  whitelist_traffic_used_gb?: number;
  days_left?: number;
  is_expired?: boolean;
}

export interface SubscriptionsListResponse {
  subscriptions: SubscriptionListItem[];
  multi_tariff_enabled: boolean;
}

export interface Device {
  hwid: string;
  platform: string;
  device_model: string;
  created_at: string | null;
  local_name?: string | null;
}

export interface RenewalOption {
  period_days: number;
  price_kopeks: number;
  price_rubles: number;
  discount_percent: number;
  original_price_kopeks: number | null;
  is_highlighted?: boolean;
}

export interface TrafficPackage {
  gb: number;
  scope?: 'regular' | 'whitelist';
  price_kopeks: number;
  price_rubles: number;
  is_unlimited: boolean;
  base_price_kopeks?: number;
  discount_percent?: number;
  discount_kopeks?: number;
  is_available?: boolean;
  unavailable_reason?: string | null;
  next_available_at?: string | null;
}

export interface TrafficResetStatus {
  enabled: boolean;
  chunk_gb: number;
  price_kopeks: number;
  price_rubles: number;
  base_price_kopeks?: number;
  discount_percent?: number;
  min_used_gb: number;
  used_gb: number;
  limit_gb: number;
  will_clear_gb: number;
  used_after_gb: number;
  max_per_month: number;
  used_this_month: number;
  remaining_this_month: number;
  next_available_at: string | null;
  unavailable_reason: 'disabled' | 'below_min_used' | 'monthly_limit' | null;
  exhausted: boolean;
}

export interface TrafficResetResponse {
  success: boolean;
  cleared_gb: number;
  new_used_gb: number;
  limit_gb: number;
  remaining_this_month: number;
  max_per_month: number;
  price_kopeks: number;
}

export interface TrialInfo {
  is_available: boolean;
  duration_days: number;
  traffic_limit_gb: number;
  device_limit: number;
  requires_payment: boolean;
  price_kopeks: number;
  price_rubles: number;
  reason_unavailable: string | null;
}

export interface PurchaseSelection {
  period_id?: string;
  period_days?: number;
  traffic_value?: number;
  servers?: string[];
  devices?: number;
}

export interface PurchasePreview {
  total_price_kopeks: number;
  total_price_label: string;
  original_price_kopeks?: number;
  original_price_label?: string;
  discount_percent?: number;
  discount_label?: string;
  per_month_price_kopeks: number;
  per_month_price_label: string;
  breakdown: Array<{ label: string; value: string }>;
  balance_kopeks: number;
  balance_label: string;
  missing_amount_kopeks: number;
  missing_amount_label?: string;
  can_purchase: boolean;
  status_message?: string;
}

export interface AppConfig {
  platformNames: Record<string, Record<string, string>>;
  hasSubscription: boolean;
  subscriptionUrl: string | null;
  hideLink?: boolean;
  branding?: { name?: string; logoUrl?: string; supportUrl?: string };
  [key: string]: unknown;
}

export interface Balance {
  balance_kopeks: number;
  balance_rubles: number;
}

export interface Transaction {
  id: number;
  type: string;
  amount_kopeks: number;
  amount_rubles: number;
  description: string | null;
  payment_method: string | null;
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  description?: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  min_amount_kopeks: number;
  max_amount_kopeks: number;
  is_available: boolean;
  options?: PaymentMethodOption[] | null;
  quick_amounts?: number[];
  open_url_direct?: boolean;
}

export interface SavedCard {
  id: number;
  method_type: string;
  card_last4: string | null;
  card_type: string | null;
  title: string | null;
  created_at: string;
}

export interface SavedCardsResponse {
  cards: SavedCard[];
  recurrent_enabled: boolean;
}

export interface PendingPayment {
  id: number;
  method: string;
  method_display: string;
  identifier: string;
  amount_kopeks: number;
  amount_rubles: number;
  status: string;
  status_emoji: string;
  status_text: string;
  is_paid: boolean;
  is_checkable: boolean;
  created_at: string;
  expires_at: string | null;
  payment_url: string | null;
  purpose?: string | null;
  purpose_code?: string | null;
}

export interface ManualCheckResponse {
  success: boolean;
  message: string;
  payment: PendingPayment | null;
  status_changed: boolean;
  old_status: string | null;
  new_status: string | null;
  is_paid?: boolean;
  settled?: boolean;
}

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  bot_referral_link?: string;
  total_referrals: number;
  active_referrals: number;
  total_earnings_kopeks: number;
  total_earnings_rubles: number;
  total_earnings_days?: number;
  commission_percent: number;
  available_balance_kopeks: number;
  available_balance_rubles: number;
  withdrawn_kopeks: number;
}

export interface ReferralTerms {
  is_enabled: boolean;
  commission_percent: number;
  minimum_topup_kopeks: number;
  minimum_topup_rubles: number;
  first_topup_bonus_kopeks: number;
  first_topup_bonus_rubles: number;
  inviter_bonus_kopeks: number;
  inviter_bonus_rubles: number;
  max_commission_payments: number;
  partner_section_visible?: boolean;
  scheme?: 'legacy' | 'levels';
  level_descriptions?: string[];
  levels_mode?: 'chain' | 'tiers';
  levels?: Array<Record<string, unknown>>;
  available_tariffs?: Array<Record<string, unknown>>;
  reward_preference?: string | null;
  allow_reward_kind_choice?: boolean;
  allow_days_target_choice?: boolean;
}

export interface TicketMediaItem {
  type: 'photo' | 'video' | 'document';
  file_id: string;
  caption?: string | null;
  token?: string | null;
}

export interface TicketMessage {
  id: number;
  message_text: string;
  is_from_admin: boolean;
  has_media: boolean;
  media_type: string | null;
  media_file_id: string | null;
  media_token?: string | null;
  media_caption: string | null;
  media_items?: TicketMediaItem[] | null;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  messages_count: number;
  last_message: TicketMessage | null;
}

export interface TicketDetail extends Omit<Ticket, 'messages_count' | 'last_message'> {
  is_reply_blocked: boolean;
  messages: TicketMessage[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface LegalConsentConfig {
  required: boolean;
  prechecked: boolean;
  documents: string[];
}

export interface FaqPage {
  id: number;
  title: string;
  content: string;
  order: number;
}

export interface InfoDocument {
  content: string;
  updated_at: string | null;
}

export interface ServiceInfo {
  name: string;
  description: string | null;
  support_email: string | null;
  support_telegram: string | null;
  website: string | null;
}

export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  category_color: string;
  category_id: number | null;
  tag: string | null;
  tag_id: number | null;
  featured_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  read_time_minutes: number;
  views_count: number;
  author_name?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface NewsListItem
  extends Omit<NewsArticle, 'content' | 'author_name' | 'created_at' | 'updated_at'> {}

export interface NewsListResponse {
  items: NewsListItem[];
  total: number;
  categories: string[];
}

export interface ContestInfo {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  prize_days: number;
  is_available: boolean;
  already_played: boolean;
}

export interface ContestGameData {
  round_id: number;
  game_type: string;
  game_data: Record<string, unknown>;
  instructions: string;
}

export interface ContestResult {
  is_winner: boolean;
  message: string;
  prize_days?: number;
}

export interface PollOption {
  id: number;
  text: string;
  order: number;
}

export interface PollQuestion {
  id: number;
  text: string;
  order: number;
  options: PollOption[];
}

export interface PollInfo {
  id: number;
  response_id: number;
  title: string;
  description: string | null;
  total_questions: number;
  answered_questions: number;
  is_completed: boolean;
  reward_amount: number | null;
}

export interface PollStartResponse {
  response_id: number;
  current_question_index: number;
  total_questions: number;
  question: PollQuestion;
}

export interface PollAnswerResponse {
  success: boolean;
  is_completed: boolean;
  next_question: PollQuestion | null;
  current_question_index: number | null;
  total_questions: number;
  reward_granted: number | null;
  message: string | null;
}

export interface WheelPrize {
  id: number;
  display_name: string;
  emoji: string;
  color: string;
  prize_type: string;
}

export interface WheelConfig {
  is_enabled: boolean;
  name: string;
  spin_cost_stars: number | null;
  spin_cost_days: number | null;
  spin_cost_stars_enabled: boolean;
  spin_cost_days_enabled: boolean;
  prizes: WheelPrize[];
  daily_limit: number;
  user_spins_today: number;
  can_spin: boolean;
  can_spin_reason: string | null;
  can_pay_stars: boolean;
  can_pay_days: boolean;
  user_balance_kopeks: number;
  required_balance_kopeks: number;
  has_subscription: boolean;
  eligible_subscriptions: Array<{
    id: number;
    tariff_name: string | null;
    days_left: number;
  }> | null;
}

export interface SpinResult {
  success: boolean;
  prize_id: number | null;
  prize_type: string | null;
  prize_value: number;
  prize_display_name: string;
  emoji: string;
  color: string;
  rotation_degrees: number;
  message: string;
  promocode: string | null;
  error: string | null;
}

export interface PromoOffer {
  id: number;
  notification_type: string;
  discount_percent: number | null;
  effect_type: string;
  expires_at: string;
  is_active: boolean;
  is_claimed: boolean;
  claimed_at: string | null;
  extra_data: Record<string, unknown> | null;
}

export interface PromoGroupDiscounts {
  group_name: string | null;
  server_discount_percent: number;
  traffic_discount_percent: number;
  device_discount_percent: number;
  period_discounts: Record<string, number>;
}

export interface LoyaltyTiersResponse {
  tiers: Array<{
    id: number;
    name: string;
    threshold_rubles: number;
    server_discount_percent: number;
    traffic_discount_percent: number;
    device_discount_percent: number;
    period_discounts: Record<string, number>;
    is_current: boolean;
    is_achieved: boolean;
  }>;
  current_spent_rubles: number;
  current_tier_name: string | null;
  next_tier_name: string | null;
  next_tier_threshold_rubles: number | null;
  progress_percent: number;
}

export interface NotificationSettings {
  subscription_expiry_enabled: boolean;
  subscription_expiry_days: number;
  traffic_warning_enabled: boolean;
  traffic_warning_percent: number;
  balance_low_enabled: boolean;
  balance_low_threshold: number;
  news_enabled: boolean;
  promo_offers_enabled: boolean;
}

export interface PartnerApplicationInfo {
  id: number;
  status: string;
  company_name: string | null;
  website_url: string | null;
  telegram_channel: string | null;
  description: string | null;
  expected_monthly_referrals: number | null;
  desired_commission_percent: number | null;
  admin_comment: string | null;
  approved_commission_percent: number | null;
  created_at: string;
  processed_at: string | null;
}

export interface PartnerCampaignInfo {
  id: number;
  name: string;
  start_parameter: string;
  bonus_type: string;
  balance_bonus_kopeks: number;
  subscription_duration_days: number | null;
  subscription_traffic_gb: number | null;
  deep_link: string | null;
  web_link: string | null;
  registrations_count: number;
  referrals_count: number;
  earnings_kopeks: number;
}

export interface PartnerStatusResponse {
  partner_status: string;
  commission_percent: number | null;
  latest_application: PartnerApplicationInfo | null;
  campaigns: PartnerCampaignInfo[];
}

export interface WithdrawalBalanceResponse {
  total_earned: number;
  referral_spent: number;
  withdrawn: number;
  pending: number;
  available_referral: number;
  available_total: number;
  only_referral_mode: boolean;
  min_amount_kopeks: number;
  is_withdrawal_enabled: boolean;
  can_request: boolean;
  cannot_request_reason: string | null;
  requisites_text: string;
}

export interface PurchaseRequest {
  tariff_id: number;
  period_days: number;
  contact_type: 'email' | 'telegram';
  contact_value: string;
  payment_method: string;
  is_gift: boolean;
  gift_recipient_type?: 'email' | 'telegram';
  gift_recipient_value?: string;
  gift_message?: string;
  language?: string;
  campaign_slug?: string;
}

export interface PurchaseStatus {
  status: 'pending' | 'paid' | 'delivered' | 'pending_activation' | 'failed' | 'expired';
  subscription_url: string | null;
  subscription_crypto_link: string | null;
  is_gift: boolean;
  contact_value: string | null;
  recipient_contact_value: string | null;
  period_days: number | null;
  tariff_name: string | null;
  gift_message: string | null;
  contact_type: 'email' | 'telegram' | null;
  cabinet_email: string | null;
  cabinet_password: string | null;
  auto_login_token: string | null;
  is_claimable: boolean;
  claim_url: string | null;
  bot_claim_link: string | null;
}
