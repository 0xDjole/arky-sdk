import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";
import type { Block } from "../types";

export type ReactionTargetType =
  | "product"
  | "service"
  | "provider"
  | "booking"
  | "node";

export type ReactionStatus = "pending" | "published" | "hidden" | "removed";

export interface ReactionTarget {
  type: ReactionTargetType;
  id: string;
}

export interface Reaction {
  id: string;
  businessId: string;
  customerId: string;
  verified: boolean;
  target: ReactionTarget;
  parentId?: string | null;
  kind: string;
  blocks: Block[];
  taxonomies: any[];
  status: ReactionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface CreateReactionParams {
  businessId?: string;
  target: ReactionTarget;
  kind: string;
  blocks?: Block[];
  parentId?: string;
  taxonomies?: any[];
  customerId?: string;
}

export interface UpdateReactionParams {
  id: string;
  businessId?: string;
  blocks?: Block[];
  taxonomies?: any[];
}

export interface GetReactionParams {
  id: string;
  businessId?: string;
}

export interface FindReactionsParams {
  businessId?: string;
  targetType?: ReactionTargetType;
  targetId?: string;
  parentId?: string;
  customerId?: string;
  kind?: string;
  status?: ReactionStatus;
  contentOnly?: boolean;
  verified?: boolean;
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface ModerateReactionParams {
  id: string;
  businessId?: string;
  status: ReactionStatus;
}

export interface EngagementSummaryParams {
  businessId?: string;
  targetType: ReactionTargetType;
  targetId: string;
  parentId?: string;
}

export interface EngagementSummary {
  counts: Record<string, number>;
  mine: Reaction[];
}

export const DEFAULT_REACTION_KINDS = [
  "like",
  "love",
  "laugh",
  "wow",
  "sad",
  "insightful",
  "review",
  "comment",
  "star_1",
  "star_2",
  "star_3",
  "star_4",
  "star_5",
] as const;

export const REACTION_KIND_REGEX = /^[a-z0-9_]{1,32}$/;

export function isValidReactionKind(kind: string): boolean {
  return REACTION_KIND_REGEX.test(kind);
}

export function computeAverageStars(
  counts: Record<string, number>
): { average: number; count: number } {
  let total = 0;
  let weighted = 0;
  for (let i = 1; i <= 5; i++) {
    const c = counts[`star_${i}`] ?? 0;
    total += c;
    weighted += c * i;
  }
  return {
    average: total > 0 ? weighted / total : 0,
    count: total,
  };
}

export const createReactionApi = (apiConfig: ApiConfig) => {
  const base = (businessId?: string) =>
    `/v1/businesses/${businessId || apiConfig.businessId}/reactions`;

  return {
    DEFAULT_REACTION_KINDS,
    isValidReactionKind,
    computeAverageStars,

    async create(params: CreateReactionParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        base(businessId),
        {
          businessId,
          target: params.target,
          kind: params.kind,
          blocks: params.blocks || [],
          parentId: params.parentId,
          taxonomies: params.taxonomies || [],
        },
        options
      );
    },

    async get(params: GetReactionParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `${base(businessId)}/${params.id}`,
        options
      );
    },

    async find(params?: FindReactionsParams, options?: RequestOptions) {
      const businessId = params?.businessId || apiConfig.businessId;
      const queryParams: Record<string, any> = {};
      if (params?.targetType) queryParams.targetType = params.targetType;
      if (params?.targetId) queryParams.targetId = params.targetId;
      if (params?.parentId) queryParams.parentId = params.parentId;
      if (params?.customerId) queryParams.customerId = params.customerId;
      if (params?.kind) queryParams.kind = params.kind;
      if (params?.status) queryParams.status = params.status;
      if (params?.contentOnly !== undefined)
        queryParams.contentOnly = params.contentOnly;
      if (params?.verified !== undefined)
        queryParams.verified = params.verified;
      if (params?.query) queryParams.query = params.query;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;

      return apiConfig.httpClient.get(
        base(businessId),
        { ...options, params: queryParams }
      );
    },

    async update(params: UpdateReactionParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `${base(businessId)}/${params.id}`,
        {
          id: params.id,
          businessId,
          blocks: params.blocks,
          taxonomies: params.taxonomies,
        },
        options
      );
    },

    async remove(params: { id: string; businessId?: string }, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `${base(businessId)}/${params.id}`,
        options
      );
    },

    async moderate(params: ModerateReactionParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `${base(businessId)}/${params.id}/moderate`,
        {
          id: params.id,
          businessId,
          status: params.status,
        },
        options
      );
    },

    async listAdmin(
      params: { businessId?: string; limit?: number; cursor?: string },
      options?: RequestOptions
    ) {
      const businessId = params.businessId || apiConfig.businessId;
      const queryParams: Record<string, any> = { businessId };
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.cursor) queryParams.cursor = params.cursor;
      return apiConfig.httpClient.get(
        `${base(businessId)}/admin`,
        { ...options, params: queryParams }
      );
    },

    async summary(params: EngagementSummaryParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `${base(businessId)}/summary`,
        {
          ...options,
          params: {
            businessId,
            targetType: params.targetType,
            targetId: params.targetId,
            parentId: params.parentId,
          },
        }
      );
    },
  };
};
