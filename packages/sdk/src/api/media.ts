export const createMediaApi = (httpClient: any, config: { baseUrl: string; getTokens: () => any }) => ({
	async uploadBusinessMedia({
		businessId,
		files = [],
		urls = []
	}: {
		businessId: string;
		files?: File[];
		urls?: string[];
	}) {
		const url = `${config.baseUrl}/v1/businesses/${businessId}/upload`;

		const formData = new FormData();

		files.forEach((file) => {
			formData.append('files', file);
		});

		urls.forEach((url) => {
			formData.append('files', url);
		});

		try {
			const tokens = await config.getTokens();
			const response = await fetch(url, {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`
				}
			});

			if (!response.ok) {
				throw new Error('Upload failed, server said no');
			}

			const mediaArray = await response.json();
			return mediaArray;
		} catch (error) {
			console.error('Error during upload:', error);
			throw error;
		}
	},

	async deleteBusinessMedia({ id, mediaId }: { id: string; mediaId: string }) {
		return httpClient.delete<void>(`/v1/businesses/${id}/upload`, {
			params: { mediaId },
			successMessage: 'Media deleted successfully',
			errorMessage: 'Failed to delete media'
		});
	},

	async getBusinessMedia({
		businessId,
		cursor = null,
		limit = 20
	}: {
		businessId: string;
		cursor?: string | null;
		limit?: number;
	}) {
		const url = `${config.baseUrl}/v1/businesses/${businessId}/media`;

		try {
			const params: any = { limit };
			if (cursor) {
				params.cursor = cursor;
			}

			const queryString = new URLSearchParams(params).toString();
			const response = await fetch(`${url}?${queryString}`);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(errorData?.message || 'Failed to fetch media');
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching business media:', error);
			throw error;
		}
	}
});
