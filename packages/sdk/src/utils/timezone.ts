// Timezone utilities (moved from Reservation folder)

export const tzGroups = [
    {
        label: "US",
        zones: [
            { label: "Eastern Time", value: "America/New_York" },
            { label: "Central Time", value: "America/Chicago" },
            { label: "Mountain Time", value: "America/Denver" },
            { label: "Pacific Time", value: "America/Los_Angeles" },
        ],
    },
    {
        label: "Europe",
        zones: [
            { label: "London", value: "Europe/London" },
            { label: "Paris", value: "Europe/Paris" },
            { label: "Berlin", value: "Europe/Berlin" },
            { label: "Rome", value: "Europe/Rome" },
        ],
    },
    {
        label: "Asia",
        zones: [
            { label: "Tokyo", value: "Asia/Tokyo" },
            { label: "Shanghai", value: "Asia/Shanghai" },
            { label: "Mumbai", value: "Asia/Kolkata" },
            { label: "Dubai", value: "Asia/Dubai" },
        ],
    },
];

export function findTimeZone(groups: typeof tzGroups): string {
    try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Check if detected timezone is in our list
        for (const group of groups) {
            for (const zone of group.zones) {
                if (zone.value === detected) {
                    return detected;
                }
            }
        }
        
        // Fallback to UTC if not found
        return "UTC";
    } catch (e) {
        // Fallback to UTC if detection fails
        return "UTC";
    }
}