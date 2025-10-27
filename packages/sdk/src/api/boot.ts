export const createBootApi = (httpClient: any) => ({
	async boot() {
		const result = await httpClient.get(`/v1/boot`);

		return {
			businessId: result.businessId as string,
			categoryId: result.categoryId as string
		};
	}
});
