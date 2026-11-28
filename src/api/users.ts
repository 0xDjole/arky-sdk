import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AddUserContactParams,
  CreateUserParams,
  User,
  UserExport,
  UserInvite,
  UserSearchSnapshot,
  UserSession,
  EraseUserParams,
  ExportUserParams,
  FindUserInvitesParams,
  InviteUserContactParams,
  MergeUserParams,
  RemoveUserContactParams,
  RemoveUserLinkParams,
  UpdateUserContactParams,
  FindUserSessionsParams,
  FindUsersParams,
  GetUserParams,
  ImportUsersParams,
  ImportUsersPreviewResult,
  ImportUsersResult,
  RevokeAllUserSessionsParams,
  RevokeUserSessionParams,
  UpdateUserParams,
} from "../types/user";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createUsersApi = (apiConfig: ApiConfig) => {
  const userPath = (tenantId: string, id: string) => tenantRecordPath(tenantId, "users", id);

  return {
    find(params: FindUsersParams, options?: RequestOptions): Promise<PaginatedResponse<UserSearchSnapshot>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<UserSearchSnapshot>>(tenantPath(tenant_id, "users"), {
        ...options,
        params: query,
      });
    },

    get(params: GetUserParams, options?: RequestOptions): Promise<User> {
      return apiConfig.httpClient.get<User>(userPath(params.tenant_id, params.id), options);
    },

    create(params: CreateUserParams, options?: RequestOptions): Promise<User> {
      requireId(params.id, "user");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<User>(tenantPath(tenant_id, "users"), body, options);
    },

    update(params: UpdateUserParams, options?: RequestOptions): Promise<User> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.patch<User>(userPath(tenant_id, id), body, options);
    },

    erase(params: EraseUserParams, options?: RequestOptions): Promise<User> {
      return apiConfig.httpClient.post<User>(
        `${userPath(params.tenant_id, params.id)}/erase`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    export(params: ExportUserParams, options?: RequestOptions): Promise<UserExport> {
      return apiConfig.httpClient.get<UserExport>(`${userPath(params.tenant_id, params.id)}/export`, options);
    },

    merge(params: MergeUserParams, options?: RequestOptions): Promise<User> {
      requireId(params.target_user_id, "user");
      return apiConfig.httpClient.post<User>(`${userPath(params.tenant_id, params.id)}/merge`, {
        target_user_id: params.target_user_id, expected_updated_at: params.expected_updated_at,
      }, options);
    },

    addContact(params: AddUserContactParams, options?: RequestOptions): Promise<User> {
      return apiConfig.httpClient.post<User>(`${userPath(params.tenant_id, params.user_id)}/contacts`, {
        expected_updated_at: params.expected_updated_at,
        contact: params.contact,
        sms: params.sms ?? null,
      }, options);
    },

    updateContact(params: UpdateUserContactParams, options?: RequestOptions): Promise<User> {
      const { tenant_id, user_id, ...body } = params;
      return apiConfig.httpClient.put<User>(`${userPath(tenant_id, user_id)}/contacts`, body, options);
    },

    removeContact(params: RemoveUserContactParams, options?: RequestOptions): Promise<User> {
      return apiConfig.httpClient.post<User>(
        `${userPath(params.tenant_id, params.user_id)}/contacts/remove`,
        { expected_updated_at: params.expected_updated_at, address: params.address },
        options,
      );
    },

    removeLink(params: RemoveUserLinkParams, options?: RequestOptions): Promise<User> {
      if (!Number.isInteger(params.position) || params.position < 0) {
        throw new TypeError("A link's position is its index in the user's links list");
      }
      return apiConfig.httpClient.delete<User>(
        `${userPath(params.tenant_id, params.user_id)}/links/${params.position}`,
        { ...options, params: { expected_updated_at: params.expected_updated_at } },
      );
    },

    findInvites(params: FindUserInvitesParams, options?: RequestOptions): Promise<UserInvite[]> {
      return apiConfig.httpClient.get<UserInvite[]>(`${userPath(params.tenant_id, params.user_id)}/invites`, options);
    },

    inviteContact(params: InviteUserContactParams, options?: RequestOptions): Promise<UserInvite> {
      requireId(params.id, "user invite");
      return apiConfig.httpClient.post<UserInvite>(
        `${userPath(params.tenant_id, params.user_id)}/invites`,
        { id: params.id, address: params.address },
        options,
      );
    },

    import(params: ImportUsersParams, options?: RequestOptions): Promise<ImportUsersResult> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<ImportUsersResult>(tenantPath(tenant_id, "users/import"), body, options);
    },

    previewImport(params: ImportUsersParams, options?: RequestOptions): Promise<ImportUsersPreviewResult> {
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<ImportUsersPreviewResult>(
        tenantPath(tenant_id, "users/import/preview"),
        body,
        options,
      );
    },

    findSessions(params: FindUserSessionsParams, options?: RequestOptions): Promise<PaginatedResponse<UserSession>> {
      const { tenant_id, user_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<UserSession>>(`${userPath(tenant_id, user_id)}/sessions`, {
        ...options,
        params: query,
      });
    },

    revokeSession(params: RevokeUserSessionParams, options?: RequestOptions): Promise<{ success: boolean }> {
      return apiConfig.httpClient.post<{ success: boolean }>(
        `${userPath(params.tenant_id, params.user_id)}/sessions/${segment(params.session_id)}/revoke`,
        undefined,
        options,
      );
    },

    revokeAllSessions(params: RevokeAllUserSessionsParams, options?: RequestOptions): Promise<{ success: boolean }> {
      return apiConfig.httpClient.post<{ success: boolean }>(
        `${userPath(params.tenant_id, params.user_id)}/sessions/revoke`,
        undefined,
        options,
      );
    },
  };
};
