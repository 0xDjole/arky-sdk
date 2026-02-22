import type { BusinessConfig } from '../types';

export function getPaymentConfig(configs: BusinessConfig): { publishableKey: string; currency: string } | null {
	const i = configs.integrations?.find(i => i.provider?.type === 'stripe' && i.provider.activeForCardPayments);
	if (!i || i.provider?.type !== 'stripe') return null;
	return { publishableKey: i.provider.publishableKey, currency: i.provider.currency };
}

export function getAnalyticsConfigs(configs: BusinessConfig): { measurementId: string }[] {
	return (configs.integrations || [])
		.filter(i => i.provider?.type === 'google_analytics4' && i.provider.activeForTracking)
		.map(i => {
			if (i.provider.type === 'google_analytics4') {
				return { measurementId: i.provider.measurementId };
			}
			return null;
		})
		.filter(Boolean) as { measurementId: string }[];
}
