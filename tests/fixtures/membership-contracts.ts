import type {
  CustomerGroupStatus,
  CustomerGroupEditableStatus,
  CustomerGroupCommunication,
  CustomerGroupJoinPolicy,
  CustomerGroupAdmission,
  CustomerGroupAdministrativeAccess,
  SubscriptionPlanStatus,
  StorefrontCustomerGroup,
  StorefrontSubscriptionPlan,
  UpdateCustomerGroupParams,
  BookingServiceStatus,
  BookingResourceStatus,
  BookingOfferingStatus,
  DigitalProductStatus,
  EpochMilliseconds,
  FindStorefrontSubscriptionPlansParams,
  GetStorefrontSubscriptionPlanParams,
} from "arky-sdk";

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type GrantedAdmission = Extract<CustomerGroupAdmission, { type: "granted" }>;
type RevokedAdmission = Extract<CustomerGroupAdmission, { type: "revoked" }>;
type EmailCommunication = Extract<
  CustomerGroupCommunication,
  { type: "email" }
>;

export type MembershipContracts = [
  Expect<Equal<NonNullable<FindStorefrontSubscriptionPlansParams["sort_field"]>, "key" | "created_at" | "price">>,
  Expect<Equal<FindStorefrontSubscriptionPlansParams["include_price"], boolean | undefined>>,
  Expect<Equal<GetStorefrontSubscriptionPlanParams["subscription_offering_id"], string | undefined>>,
  Expect<
    Equal<
      CustomerGroupStatus["type"],
      "draft" | "active" | "closed" | "archived" | "deleting"
    >
  >,
  Expect<
    Equal<
      CustomerGroupEditableStatus["type"],
      "draft" | "active" | "closed" | "archived"
    >
  >,
  Expect<
    Equal<UpdateCustomerGroupParams["status"], CustomerGroupEditableStatus>
  >,
  Expect<Equal<CustomerGroupJoinPolicy["type"], "open" | "private">>,
  Expect<
    Equal<
      EmailCommunication["consent_policy"]["type"],
      "immediate" | "confirmation"
    >
  >,
  Expect<
    Equal<
      CustomerGroupAdmission["type"],
      "requested" | "granted" | "revoked"
    >
  >,
  Expect<Equal<GrantedAdmission["granted_at"], EpochMilliseconds>>,
  Expect<Equal<RevokedAdmission["reason"], string>>,
  Expect<
    Equal<CustomerGroupAdministrativeAccess["expires_at"], EpochMilliseconds | null>
  >,
  Expect<
    Equal<
      Extract<keyof StorefrontCustomerGroup, "status" | "store_id">,
      never
    >
  >,
  Expect<Equal<StorefrontSubscriptionPlan["purchase_allowed"], boolean>>,
  Expect<
    Equal<
      Extract<keyof StorefrontSubscriptionPlan, "status" | "store_id">,
      never
    >
  >,
  Expect<
    Equal<
      SubscriptionPlanStatus["type"],
      "draft" | "active" | "closed" | "archived"
    >
  >,
  Expect<Equal<BookingServiceStatus["type"], "draft" | "active" | "archived">>,
  Expect<Equal<BookingResourceStatus["type"], "draft" | "active" | "archived">>,
  Expect<Equal<BookingOfferingStatus["type"], "draft" | "active" | "archived">>,
  Expect<Equal<DigitalProductStatus["type"], "draft" | "active" | "archived">>,
];
