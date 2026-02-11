import type { BusinessConfig, Integration } from '../types';

export function getPaymentConfig(configs: BusinessConfig): { publishableKey: string; currency: string } | null {
	if (!configs.paymentId) return null;
	const i = configs.integrations?.find(i => i.id === configs.paymentId);
	if (!i || i.provider?.type !== 'stripe') return null;
	return { publishableKey: i.provider.publishableKey, currency: i.provider.currency };
}

export function getAnalyticsConfigs(configs: BusinessConfig): { measurementId: string }[] {
	return (configs.analyticsIds || [])
		.map(id => configs.integrations?.find(i => i.id === id))
		.filter((i): i is Integration => !!i && i.provider?.type === 'google_analytics4')
		.map(i => {
			if (i.provider.type === 'google_analytics4') {
				return { measurementId: i.provider.measurementId };
			}
			return null;
		})
		.filter(Boolean) as { measurementId: string }[];
}
