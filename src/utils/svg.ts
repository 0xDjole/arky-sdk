import { getImageUrl } from "./blocks";

export async function fetchSvgContent(mediaObject: any): Promise<string | null> {
	if (!mediaObject) return null;

	const svgUrl = getImageUrl(mediaObject, false);

	try {
		const response = await fetch(svgUrl);

		if (!response.ok) {
			console.error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
			return null;
		}

		const svgContent = await response.text();
		return svgContent;
	} catch (error) {
		console.error("Error fetching SVG:", error);
		return null;
	}
}

export async function getSvgContentForAstro(mediaObject: any): Promise<string> {
	try {
		const svgContent = await fetchSvgContent(mediaObject);
		return svgContent || "";
	} catch (error) {
		console.error("Error getting SVG content for Astro:", error);
		return "";
	}
}

export async function injectSvgIntoElement(
	mediaObject: any,
	targetElement: HTMLElement,
	className?: string,
): Promise<void> {
	if (!targetElement) return;

	try {
		const svgContent = await fetchSvgContent(mediaObject);

		if (svgContent) {
			targetElement.innerHTML = svgContent;

			if (className) {
				const svgElement = targetElement.querySelector("svg");
				if (svgElement) {
					svgElement.classList.add(...className.split(" "));
				}
			}
		}
	} catch (error) {
		console.error("Error injecting SVG:", error);
	}
}