import type {
  AudienceType,
  StorefrontAudienceType,
  PatchAudienceParams,
  AudienceMembershipAdminType,
  AudienceMembershipType,
  AudienceConfirmationEmailAdminStatus,
  AudienceConfirmationEmailStatus,
  AudienceStatus,
  BookingServiceStatus,
  BookingResourceStatus,
  BookingOfferingStatus,
  DigitalProductStatus,
  EpochMilliseconds,
} from "arky-sdk";

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type AdminConfirmation = Extract<
  AudienceMembershipAdminType,
  { type: "confirmation_pending" }
>;
type PublicConfirmation = Extract<
  AudienceMembershipType,
  { type: "confirmation_pending" }
>;
type PublicSent = Extract<AudienceConfirmationEmailStatus, { type: "sent" }>;
type AdminSent = Extract<
  AudienceConfirmationEmailAdminStatus,
  { type: "sent" }
>;

export type MembershipContracts = [
  Expect<Equal<Extract<AudienceType, { type: "paid" }>, { type: "paid" }>>,
  Expect<
    Equal<
      keyof Extract<StorefrontAudienceType, { type: "paid" }>,
      "type" | "prices" | "purchase_allowed"
    >
  >,
  Expect<
    Equal<PatchAudienceParams["type"], "update_draft_key" | "update_name">
  >,
  Expect<
    Equal<
      AudienceMembershipType["type"],
      "free" | "confirmation_pending" | "paid"
    >
  >,
  Expect<Equal<AdminConfirmation["issued_at"], EpochMilliseconds>>,
  Expect<
    Equal<
      Extract<keyof PublicConfirmation, "confirmation_id" | "issued_at">,
      never
    >
  >,
  Expect<
    Equal<
      Extract<keyof PublicSent, "provider_message_id" | "provider_status">,
      never
    >
  >,
  Expect<Equal<AdminSent["provider_status"], number | null>>,
  Expect<
    Equal<AudienceStatus["type"], "draft" | "active" | "closed" | "archived">
  >,
  Expect<Equal<BookingServiceStatus["type"], "draft" | "active" | "archived">>,
  Expect<Equal<BookingResourceStatus["type"], "draft" | "active" | "archived">>,
  Expect<Equal<BookingOfferingStatus["type"], "draft" | "active" | "archived">>,
  Expect<Equal<DigitalProductStatus["type"], "draft" | "active" | "archived">>,
];
