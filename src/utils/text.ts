
const locales = ['en', 'sr-latn'] as const;
const localeMap: Record<typeof locales[number], string> = {
	'en': 'en-US',
	'sr-latn': 'sr-RS'
};

export function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase() 
		.replace(/\s+/g, "-") 
		.replace(/[^\w-]+/g, "") 
		.replace(/--+/g, "-") 
		.replace(/^-+/, "") 
		.replace(/-+$/, ""); 
}

export function humanize(text: string): string {
	const slugifiedText = slugify(text);
	return (
		slugifiedText
			.replace(/-/g, " ") 
			
			.replace(
				
				/\w\S*/g,
				(w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
			)
	);
}

export function categorify(text: string): string {
	const slugifiedText = slugify(text);
	return slugifiedText
		.replace(/-/g, " ") 
		.toUpperCase();
}

export function formatDate(date: string | number | Date, locale: (typeof locales)[number]): string {
	let localeString = "en-US";

	if (locales.includes(locale)) {
		localeString = localeMap[locale];
	}

	return new Date(date).toLocaleDateString(localeString, {
		timeZone: "UTC",
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}