export function stripeConnectionFixture(storeId, providerId, operationId) {
  const stage = {
    type: 'succeeded', connected_account_id: 'acct_contract',
    observation: { type: 'exact_read', observed_at: 2, provider_updated_at: null }, completed_at: 2
  };
  return {
    provider: {
      id: providerId, store_id: storeId, key: 'stripe', blocks: [], status: { type: 'active' },
      configuration: { type: 'stripe', connection: {
        type: 'connected', connected_account_id: 'acct_contract', account_setup_submitted: true,
        payments_enabled: true, payouts_enabled: true, state_observed_at: 2,
        platform_debit_consent: null
      } }, created_at: 1, updated_at: 2
    },
    operation: {
      id: operationId, store_id: storeId, payment_option_id: providerId,
      requested_connected_account_id: null, email: null, country: 'BA', debit_consent_account_id: null,
      account_creation_status: stage, metadata_setup_status: stage, created_at: 1, updated_at: 2
    },
    onboarding_url: 'https://connect.test/onboarding'
  };
}
