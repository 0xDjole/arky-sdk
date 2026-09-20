import type { createAdmin } from "arky-sdk/admin";
import type { Campaign, CampaignEnrollment, CampaignMessage, CampaignEmailStatus, CampaignOutgoingStatus, FindCampaignsParams, FindCampaignEnrollmentsParams, PaginatedResponse } from "arky-sdk";
import type { CampaignEnrollment as PublicEnrollment } from "arky-sdk/types";
import type { CampaignEnrollmentConversationResponse, GetCampaignEnrollmentConversationParams } from "arky-sdk";
type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Api = ReturnType<typeof createAdmin>;
export const campaignQuery: FindCampaignsParams = { store_id: "store", query: "Život", status: "paused", sort_field: "updated_at", sort_direction: "asc", limit: 20 };
export const customerQuery: FindCampaignEnrollmentsParams = { store_id: "store", customer_id: "customer", limit: 20 };
export const conversationQuery: GetCampaignEnrollmentConversationParams = { store_id: "store", campaign_id: "campaign", id: "enrollment", limit: 20, cursor: "opaque" };
export type CampaignContracts = [
  True<Same<Awaited<ReturnType<Api["campaignEnrollment"]["getConversation"]>>, CampaignEnrollmentConversationResponse>>,
  True<Same<Awaited<ReturnType<Api["campaign"]["find"]>>, PaginatedResponse<Campaign>>>,
  True<Same<CampaignEnrollment, PublicEnrollment>>,
  True<Same<Awaited<ReturnType<Api["campaign"]["findEnrollments"]>>, PaginatedResponse<CampaignEnrollment>>>,
  True<Same<Campaign["status"]["type"], "draft" | "active" | "paused" | "completed">>,
  True<Same<CampaignEnrollment["status"]["type"], "pending" | "active" | "replied" | "completed" | "stopped">>,
  True<Same<CampaignOutgoingStatus["type"], "draft" | "submitted">>,
  True<"unknown" extends CampaignEmailStatus["type"] ? true : false>,
  True<"submitted" extends keyof Extract<CampaignMessage["type"], { type: "outgoing" }> ? false : true>,
];
