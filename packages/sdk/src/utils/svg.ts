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

/**
 * Server-side helper for Astro components to fetch SVG content during SSR
 *
 * @param mediaObject The media object from the CMS
 * @returns The SVG content as a string, or empty string on failure
 */
export async function getSvgContentForAstro(mediaObject: any): Promise<string> {
	try {
		const svgContent = await fetchSvgContent(mediaObject);
		return svgContent || "";
	} catch (error) {
		console.error("Error getting SVG content for Astro:", error);
		return "";
	}
}

/**
 * Client-side helper to fetch and inject SVG content into DOM elements
 *
 * @param mediaObject The media object from the CMS
 * @param targetElement The DOM element to inject the SVG into
 * @param className Optional CSS class to add to the SVG
 */
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

			// Add class if provided
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