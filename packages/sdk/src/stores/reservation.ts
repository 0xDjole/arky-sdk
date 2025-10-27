// Reservation store with TypeScript - Simplified with Business Store
import { computed, deepMap } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { getLocalizedString, getLocale, getLocaleFromUrl } from "../utils/i18n";
import { API_URL, BUSINESS_ID, STORAGE_URL } from "../config";
import { reservationApi } from "../api/reservation";
import { getMarketPrice, getPriceAmount, createPaymentForCheckout } from "../utils/price";
import * as authService from "../services/auth";
import { validatePhoneNumber } from "../utils/validation";
import { tzGroups, findTimeZone } from "../utils/timezone";
import {
    selectedMarket,
    currency,
    paymentMethods,
    paymentConfig,
    reservationBlocks,
    businessActions
} from "./business";
import type { ReservationStoreState, ReservationCartPart, Business, Block, Payment } from "../types";
import { PaymentMethod } from "../types";

export const cartParts = persistentAtom<ReservationCartPart[]>("reservationCart", [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

export const store = deepMap({
    currentStep: 1,
    totalSteps: 4,
    steps: {
        1: { name: "method", labelKey: "method" },
        2: { name: "provider", labelKey: "provider" },
        3: { name: "datetime", labelKey: "datetime" },
        4: { name: "review", labelKey: "review" },
    },

    // Calendar data
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    monthYear: "",
    days: [],
    current: new Date(),

    // Selection state
    selectedDate: null,
    slots: [],
    selectedSlot: null,
    selectedMethod: null,
    selectedProvider: null,
    providers: [],

    // Status flags
    loading: false,
    startDate: null,
    endDate: null,
    isMultiDay: false,

    // Phone verification
    phoneNumber: "",
    phoneError: null,
    phoneSuccess: null,
    verificationCode: "",
    verifyError: null,
    isPhoneVerified: false,
    isSendingCode: false,
    isVerifying: false,
    codeSentAt: null,
    canResendAt: null,

    // Quote state
    fetchingQuote: false,
    quote: null,
    quoteError: null,

    // Service & config
    guestToken: null,
    service: null,
    apiUrl: API_URL,
    businessId: BUSINESS_ID,
    storageUrl: STORAGE_URL,
    timezone: findTimeZone(tzGroups),
    tzGroups,
    parts: [],
});

export const currentStepName = computed(store, (state) => {
    return state?.steps?.[state?.currentStep]?.name || "";
});

export const canProceed = computed(store, (state) => {
    const stepName = state?.steps?.[state?.currentStep]?.name;
    switch (stepName) {
        case "method":
            return !!state.selectedMethod;
        case "provider":
            return !!state.selectedProvider;
        case "datetime":
            return state.isMultiDay
                ? !!(state.startDate && state.endDate && state.selectedSlot)
                : !!(state.selectedDate && state.selectedSlot);
        case "review":
            return true;
        default:
            return false;
    }
});

const createCalendarGrid = (date: Date) => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const cells: any[] = [];

    // Leading blanks
    const pad = (first.getDay() + 6) % 7;
    for (let i = 0; i < pad; i++) cells.push({ key: `b-${i}`, blank: true });

    // Date cells
    for (let d = 1; d <= last.getDate(); d++) {
        cells.push({
            key: `d-${d}`,
            blank: false,
            date: new Date(date.getFullYear(), date.getMonth(), d),
            available: false,
        });
    }

    // Trailing blanks
    const suffix = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < suffix; i++) cells.push({ key: `b2-${i}`, blank: true });

    return cells;
};

const formatTimeSlot = (from: number, to: number, timezone: string) => {
    const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZone: timezone };
    return `${new Date(from * 1000).toLocaleTimeString([], opts)} – ${new Date(to * 1000).toLocaleTimeString([], opts)}`;
};

// Actions
export const actions = {
    // Calendar management
    updateCalendarGrid() {
        const state = store.get();
        const cur = state.current || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const days = createCalendarGrid(cur);

        store.setKey("current", cur);
        store.setKey("monthYear", cur.toLocaleString(undefined, { month: "long", year: "numeric" }));
        store.setKey("days", days);
    },

    updateCalendar() {
        this.updateCalendarGrid();
        const state = store.get();
        if (state.service) this.fetchAvailability("month");
    },

    prevMonth() {
        const { current } = store.get();
        store.setKey("current", new Date(current.getFullYear(), current.getMonth() - 1, 1));
        this.updateCalendar();
    },

    nextMonth() {
        const { current } = store.get();
        store.setKey("current", new Date(current.getFullYear(), current.getMonth() + 1, 1));
        this.updateCalendar();
    },

    // Service initialization
    setService(service: any) {
        store.setKey("service", service);
        store.setKey("selectedMethod", null);
        store.setKey("selectedProvider", null);
        store.setKey("providers", []);
        store.setKey("selectedDate", null);
        store.setKey("startDate", null);
        store.setKey("endDate", null);
        store.setKey("slots", []);
        store.setKey("selectedSlot", null);
        store.setKey("currentStep", 1);
        store.setKey("isMultiDay", !!service?.reservationConfigs?.isMultiDay);

        const now = new Date();
        store.setKey("current", new Date(now.getFullYear(), now.getMonth(), 1));
        this.updateCalendarGrid();

        // Auto-select if only one method available
        if (service.reservationMethods?.length === 1) {
            const method = service.reservationMethods[0];
            store.setKey("selectedMethod", method);
            this.determineTotalSteps();
            this.handleMethodSelection(method, false);
        } else {
            this.determineTotalSteps();
        }
        this.fetchAvailability("month");
    },

    // Step management
    determineTotalSteps(): number {
        const state = store.get();
        if (!state.service) {
            store.setKey("totalSteps", 1);
            return 1;
        }

        const active: any[] = [];
        if (state.service.reservationMethods?.length > 1) {
            active.push({ name: "method", label: "Choose Reservation Type" });
        }
        if (state.selectedMethod?.includes("SPECIFIC")) {
            active.push({ name: "provider", label: "Choose Provider" });
        }
        if (state.selectedMethod && state.selectedMethod !== "ORDER") {
            active.push({
                name: "datetime",
                label: state.isMultiDay ? "Choose Date Range" : "Choose Date & Time",
            });
        }
        active.push({ name: "review", label: "Review & Confirm" });

        const stepObj: Record<number, any> = {};
        active.forEach((st, idx) => {
            stepObj[idx + 1] = st;
        });

        store.setKey("steps", stepObj as any);
        store.setKey("totalSteps", active.length);

        if (state.currentStep > active.length) {
            store.setKey("currentStep", active.length);
        }
        return active.length;
    },

    async getGuestToken(): Promise<string> {
        const state = store.get();
        const token = await authService.getGuestToken(state.guestToken);
        if (token !== state.guestToken) {
            store.setKey("guestToken", token);
        }
        return token;
    },

    getStepNumberByName(name: string): number | null {
        const { steps } = store.get();
        for (const [k, v] of Object.entries(steps)) {
            if (v.name === name) return Number(k);
        }
        return null;
    },

    nextStep() {
        const state = store.get();
        if (state.currentStep >= state.totalSteps || !canProceed.get()) return;

        const next = state.currentStep + 1;
        const name = state.steps[next]?.name;
        store.setKey("currentStep", next);

        if (name === "datetime") {
            this.fetchAvailability("month");
            if (!state.selectedDate && !state.startDate) {
                this.findFirstAvailable();
            }
        }
    },

    prevStep() {
        const state = store.get();
        if (state.currentStep <= 1) return;
        this.clearCurrentStepState();
        store.setKey("currentStep", state.currentStep - 1);
    },

    clearCurrentStepState() {
        const name = currentStepName.get();
        if (name === "method") {
            store.setKey("selectedMethod", null);
        } else if (name === "provider") {
            store.setKey("selectedProvider", null);
            store.setKey("providers", []);
        } else if (name === "datetime") {
            store.setKey("selectedDate", null);
            store.setKey("startDate", null);
            store.setKey("endDate", null);
            store.setKey("slots", []);
            store.setKey("selectedSlot", null);
        }
    },

    goToStep(step: number) {
        const state = store.get();
        if (step < 1 || step > state.totalSteps) return;

        if (step < state.currentStep) {
            for (let i = state.currentStep; i > step; i--) {
                const n = state.steps[i]?.name;
                if (n === "datetime") {
                    store.setKey("selectedDate", null);
                    store.setKey("startDate", null);
                    store.setKey("endDate", null);
                    store.setKey("slots", []);
                    store.setKey("selectedSlot", null);
                } else if (n === "provider") {
                    store.setKey("selectedProvider", null);
                    store.setKey("providers", []);
                } else if (n === "method") {
                    store.setKey("selectedMethod", null);
                }
            }
        }

        store.setKey("currentStep", step);

        if (state.steps[step]?.name === "datetime") {
            this.fetchAvailability("month");
            if (!state.selectedDate && !state.startDate) {
                this.findFirstAvailable();
            }
        }
    },

    // Method selection
    async handleMethodSelection(method: string, advance: boolean = true) {
        store.setKey("selectedDate", null);
        store.setKey("startDate", null);
        store.setKey("endDate", null);
        store.setKey("slots", []);
        store.setKey("selectedSlot", null);
        store.setKey("selectedMethod", method);

        this.determineTotalSteps();

        if (method === "ORDER") {
            this.handleOrderMethod();
            if (advance) {
                const reviewStep = this.getStepNumberByName("review");
                if (reviewStep) this.goToStep(reviewStep);
                return;
            }
        } else if (method.includes("SPECIFIC")) {
            await this.loadProviders();
            const state = store.get();
            if (advance && state.providers.length === 1) {
                this.selectProvider(state.providers[0]);
                const datetimeStep = this.getStepNumberByName("datetime");
                if (datetimeStep) this.goToStep(datetimeStep);
                return;
            }
        } else if (method === "STANDARD" && advance) {
            const datetimeStep = this.getStepNumberByName("datetime");
            if (datetimeStep) this.goToStep(datetimeStep);
            return;
        }

        if (advance && store.get().currentStep < store.get().totalSteps) {
            this.nextStep();
        }
    },

    handleOrderMethod() {
        const state = store.get();
        const now = new Date();
        const dur = state.service.durations?.reduce((a: number, c: any) => a + c.duration, 0) || 3600;
        const from = Math.floor(now.getTime() / 1000);
        const to = from + dur;

        store.setKey("selectedSlot", {
            from,
            to,
            timeText: formatTimeSlot(from, to, state.timezone),
        });
    },


    // Provider management
    async loadProviders() {
        store.setKey("loading", true);
        store.setKey("providers", []);

        try {
            const { businessId, service } = store.get();
            const res = await reservationApi.getProviders({ businessId, serviceId: service.id });
            store.setKey("providers", res.success ? res.data : []);
        } catch (e) {
            console.error("Error loading providers:", e);
        } finally {
            store.setKey("loading", false);
        }
    },

    selectProvider(provider: any) {
        store.setKey("selectedProvider", provider);
        store.setKey("selectedDate", null);
        store.setKey("startDate", null);
        store.setKey("endDate", null);
        store.setKey("slots", []);
        store.setKey("selectedSlot", null);

        if (currentStepName.get() === "datetime") {
            this.fetchAvailability("month");
            this.findFirstAvailable();
        }
    },

    // Availability and date management
    async fetchAvailability(type: string, date: string | Date | null = null) {
        const state = store.get();
        if (!state.service || currentStepName.get() !== "datetime") return;

        store.setKey("loading", true);

        try {
            let from: number, to: number, limit: number;

            if (type === "month") {
                from = Math.floor(
                    new Date(state.current.getFullYear(), state.current.getMonth(), 1).getTime() / 1000,
                );
                to = Math.floor(
                    new Date(state.current.getFullYear(), state.current.getMonth() + 1, 0).getTime() / 1000,
                );
                limit = 100;
            } else if (type === "day" && date) {
                const dObj = typeof date === "string" ? new Date(date) : date;
                from = Math.floor(dObj.getTime() / 1000);
                to = from + 24 * 3600;
                limit = 100;
            } else if (type === "first") {
                const now = new Date();
                from = Math.floor(now.setHours(0, 0, 0, 0) / 1000);
                to = Math.floor(new Date(now.getFullYear(), now.getMonth() + 3, 0).getTime() / 1000);
                limit = 1;
            } else {
                store.setKey("loading", false);
                return;
            }

            const params: any = { businessId: state.businessId, serviceId: state.service.id, from, to, limit };
            if (state.selectedProvider) params.providerId = state.selectedProvider.id;

            const result = await reservationApi.getAvailableSlots(params);
            if (!result.success) {
                console.error(`Error fetching availability (${type}):`, result.error);
                return;
            }

            if (type === "month") {
                const avail = new Set(
                    result.data.map((i: any) => {
                        const date = new Date(i.from * 1000);
                        return date.toISOString().slice(0, 10);
                    }),
                );
                store.setKey(
                    "days",
                    state.days.map((c: any) => {
                        if (!c.blank && c.date) {
                            const iso = c.date.toISOString().slice(0, 10);
                            return { ...c, available: avail.has(iso) };
                        }
                        return c;
                    }),
                );
            } else if (type === "day") {
                const slots = result.data.map((i: any, idx: number) => ({
                    ...i,
                    id: `slot-${i.from}-${idx}`,
                    day: new Date(i.from * 1000).toISOString().slice(0, 10),
                    timeText: formatTimeSlot(i.from, i.to, state.timezone),
                }));

                store.setKey("slots", slots);
                if (slots.length && !state.selectedSlot) {
                    store.setKey("selectedSlot", slots[0]);
                }
            } else if (type === "first" && result.data.length) {
                const first = new Date(result.data[0].from * 1000);
                const iso = first.toISOString().slice(0, 10);

                store.setKey("current", new Date(first.getFullYear(), first.getMonth(), 1));
                this.updateCalendarGrid();
                await this.fetchAvailability("month");

                if (state.isMultiDay) {
                    store.setKey("startDate", iso);
                    store.setKey("selectedDate", iso);
                } else {
                    store.setKey("selectedDate", iso);
                    await this.fetchAvailability("day", iso);
                }
            }
        } catch (err) {
            console.error(`Error in fetchAvailability (${type}):`, err);
        } finally {
            store.setKey("loading", false);
        }
    },

    findFirstAvailable() {
        if (currentStepName.get() === "datetime") this.fetchAvailability("first");
    },

    // Date selection
    selectDate(cell: any) {
        if (!cell.date || !cell.available) return;
        // Store date components directly to avoid timezone issues
        const dateInfo = {
            year: cell.date.getFullYear(),
            month: cell.date.getMonth() + 1,
            day: cell.date.getDate(),
            iso: `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`
        };
        const state = store.get();

        if (state.isMultiDay) {
            if (!state.startDate) {
                store.setKey("startDate", dateInfo.iso);
                store.setKey("selectedSlot", null);
                store.setKey("selectedDate", dateInfo.iso);
                store.setKey("endDate", null);
            } else if (!state.endDate) {
                const start = new Date(state.startDate).getTime();
                const cellT = cell.date.getTime();
                if (cellT < start) {
                    store.setKey("endDate", state.startDate);
                    store.setKey("startDate", dateInfo.iso);
                } else {
                    store.setKey("endDate", dateInfo.iso);
                }
            } else {
                store.setKey("startDate", dateInfo.iso);
                store.setKey("selectedDate", dateInfo.iso);
                store.setKey("endDate", null);
                store.setKey("selectedSlot", null);
            }
        } else {
            store.setKey("selectedSlot", null);
            store.setKey("selectedDate", dateInfo.iso);
            this.fetchAvailability("day", dateInfo.iso);
        }
    },

    createMultiDaySlot() {
        const state = store.get();
        if (!state.startDate || !state.endDate) return;

        const startDT = new Date(state.startDate);
        startDT.setHours(9, 0, 0, 0);
        const endDT = new Date(state.endDate);
        endDT.setHours(17, 0, 0, 0);

        const from = Math.floor(startDT.getTime() / 1000);
        const to = Math.floor(endDT.getTime() / 1000);

        const rangeSlot = {
            id: `multi-day-slot-${from}-${to}`,
            from,
            to,
            isMultiDay: true,
            timeText: `9:00 AM - 5:00 PM daily`,
            dateRange: `${this.formatDateDisplay(state.startDate)} to ${this.formatDateDisplay(state.endDate)}`,
            day: state.startDate,
        };

        store.setKey("slots", [rangeSlot]);
        store.setKey("selectedSlot", rangeSlot);
    },

    resetDateSelection() {
        store.setKey("startDate", null);
        store.setKey("endDate", null);
        store.setKey("selectedDate", null);
        store.setKey("slots", []);
        store.setKey("selectedSlot", null);
    },

    selectTimeSlot(slot: any) {
        store.setKey("selectedSlot", slot);
    },

    setSelectedTimeZone(zone: string) {
        const state = store.get();
        if (zone === state.timezone) return;

        store.setKey("timezone", zone);

        if (currentStepName.get() === "datetime") {
            if (state.selectedDate) {
                this.fetchAvailability("day", state.selectedDate);
            } else if (!state.selectedDate && !state.startDate) {
                this.findFirstAvailable();
            }
        }
    },

    // Calendar helpers
    isAvailable(cell: any): boolean {
        return cell.date && cell.available;
    },
    
    isSelectedDay(cell: any): boolean {
        if (cell.blank || !cell.date) return false;
        const iso = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
        const state = store.get();
        return iso === state.startDate || iso === state.endDate || iso === state.selectedDate;
    },
    
    isInSelectedRange(cell: any): boolean {
        const state = store.get();
        if (cell.blank || !cell.date || !state.startDate || !state.endDate) return false;
        const t = cell.date.getTime();
        const a = new Date(state.startDate).getTime();
        const b = new Date(state.endDate).getTime();
        return t >= a && t <= b;
    },
    
    formatDateDisplay(ds: string | null): string {
        if (!ds) return "";
        const d = new Date(ds);
        return d.toLocaleDateString(getLocale(), { month: "short", day: "numeric" });
    },

    // Cart operations
    addToCart(slot: any) {
        const state = store.get();
        const id = crypto.randomUUID();

        let dateDisplay: string, timeText: string;
        if (state.isMultiDay && slot.isMultiDay) {
            const a = new Date(slot.from * 1000),
                b = new Date(slot.to * 1000);
            dateDisplay = `${a.toLocaleDateString(getLocale(), { month: "short", day: "numeric" })} - ${b.toLocaleDateString(getLocale(), { month: "short", day: "numeric", year: "numeric" })}`;
            timeText = slot.timeText;
        } else {
            const date = state.selectedDate ? new Date(state.selectedDate) : new Date(slot.from * 1000);
            dateDisplay = date.toLocaleDateString(getLocale(), {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            timeText = slot.timeText;
        }

        const blocks = (state.service?.reservationBlocks || []).map((f: any) => ({
            ...f,
            value: Array.isArray(f.value) ? f.value : [f.value],
        }));

        const newPart: ReservationCartPart = {
            id,
            serviceId: state.service.id,
            serviceName: getLocalizedString(state.service.name, getLocale()),
            date: dateDisplay,
            from: slot.from,
            to: slot.to,
            timeText,
            isMultiDay: state.isMultiDay && (!!state.endDate || slot.isMultiDay),
            reservationMethod: state.selectedMethod || '',
            providerId: state.selectedProvider?.id,
            blocks,
        };

        const newParts = [...state.parts, newPart];
        store.setKey("parts", newParts);
        cartParts.set(newParts);

        this.resetDateSelection();
        store.setKey("currentStep", 1);
        if (state.service.reservationMethods?.length > 1) {
            store.setKey("selectedMethod", null);
        }
    },

    removePart(id: string) {
        const filteredParts = store.get().parts.filter((p) => p.id !== id);
        store.setKey("parts", filteredParts);
        cartParts.set(filteredParts);
    },

    // Phone validation helper (using shared utility)
    validatePhoneNumber(phone: string): boolean {
        const result = validatePhoneNumber(phone);
        return result.isValid;
    },

    // Phone verification
    async updateProfilePhone(): Promise<boolean> {
        store.setKey("phoneError", null);
        store.setKey("phoneSuccess", null);
        store.setKey("isSendingCode", true);

        try {
            const phoneNumber = store.get().phoneNumber;

            // Validate phone number format
            if (!this.validatePhoneNumber(phoneNumber)) {
                store.setKey("phoneError", "Please enter a valid phone number");
                return false;
            }

            const token = await this.getGuestToken();
            await authService.updateProfilePhone(token, phoneNumber);
            
            store.setKey("phoneSuccess", "Verification code sent successfully!");
            store.setKey("codeSentAt", Date.now());
            return true;
        } catch (e: any) {
            store.setKey("phoneError", e.message);
            return false;
        } finally {
            store.setKey("isSendingCode", false);
        }
    },

    async verifyPhoneCode(): Promise<boolean> {
        store.setKey("verifyError", null);
        store.setKey("isVerifying", true);

        try {
            const { phoneNumber, verificationCode } = store.get();

            // Validate code format
            if (!verificationCode || verificationCode.length !== 4) {
                store.setKey("verifyError", "Please enter a 4-digit verification code");
                return false;
            }

            const token = await this.getGuestToken();
            await authService.verifyPhoneCode(token, phoneNumber, verificationCode);
            
            store.setKey("isPhoneVerified", true);
            store.setKey("phoneSuccess", null);
            store.setKey("verificationCode", "");
            return true;
        } catch (e: any) {
            // Provide user-friendly error messages
            let errorMessage = "Invalid verification code";
            if (e.message?.includes("expired")) {
                errorMessage = "Verification code has expired. Please request a new one.";
            } else if (e.message?.includes("incorrect") || e.message?.includes("invalid")) {
                errorMessage = "Incorrect verification code. Please try again.";
            }
            store.setKey("verifyError", errorMessage);
            return false;
        } finally {
            store.setKey("isVerifying", false);
        }
    },

    async checkout(paymentMethod: PaymentMethod = PaymentMethod.Cash, reservationBlocks?: Block[], promoCode?: string) {
        const state = store.get();
        if (state.loading || !state.parts.length) return { success: false, error: "No parts in cart" };

        store.setKey("loading", true);

        try {
            const token = await this.getGuestToken();

            const result = await reservationApi.checkout({
                token,
                businessId: state.businessId,
                blocks: reservationBlocks || [],
                parts: state.parts,
                paymentMethod,
                market: 'us',
                promoCode,
            });

            if (result.success) {
                return {
                    success: true,
                    data: {
                        reservationId: result.data?.reservationId,
                        clientSecret: result.data?.clientSecret,
                    },
                };
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            console.error("Reservation checkout error:", e);
            return { success: false, error: e.message };
        } finally {
            store.setKey("loading", false);
        }
    },

    async fetchQuote(paymentMethod: PaymentMethod = PaymentMethod.Cash, promoCode?: string) {
        const state = store.get();

        console.log('fetchQuote called with promoCode:', promoCode);

        if (!state.parts.length) {
            store.setKey("quote", null);
            store.setKey("quoteError", null);
            return;
        }

        store.setKey("fetchingQuote", true);
        store.setKey("quoteError", null);

        try {
            const token = await this.getGuestToken();
            const marketObj = selectedMarket.get();
            const market = marketObj?.id || 'us';
            const curr = currency.get() || 'USD';

            console.log('Calling reservationApi.getQuote with:', { market, currency: curr, promoCode });

            const result = await reservationApi.getQuote({
                token,
                businessId: state.businessId,
                market,
                currency: curr,
                userId: token, // Use token as userId for guests
                parts: state.parts,
                paymentMethod,
                promoCode,
            });

            if (result.success && result.data) {
                console.log('Quote received:', result.data);
                store.setKey("quote", result.data);
                store.setKey("quoteError", null);
            } else {
                console.error('Quote error:', result.error);
                store.setKey("quote", null);
                store.setKey("quoteError", mapQuoteError(result.code, result.error));
            }
        } catch (e: any) {
            console.error("Fetch quote error:", e);
            store.setKey("quote", null);
            store.setKey("quoteError", e.message || "Failed to get quote");
        } finally {
            store.setKey("fetchingQuote", false);
        }
    },

    // Helpers
    getLabel(block: any, locale: string = getLocale()): string {
        if (!block) return "";

        if (block.properties?.label) {
            if (typeof block.properties.label === "object") {
                return (
                    block.properties.label[locale] ||
                    block.properties.label.en ||
                    Object.values(block.properties.label)[0] ||
                    ""
                );
            }
            if (typeof block.properties.label === "string") {
                return block.properties.label;
            }
        }
        return block.key || "";
    },

getServicePrice(): string {
        const state = store.get();
        if (state.service?.prices && Array.isArray(state.service.prices)) {
            // Market-based pricing (amounts are minor units)
            // TODO: Get market from business config instead of hardcoded 'us'
            return getMarketPrice(state.service.prices, 'us');
        }
        return '';
    },

    // NEW: Get reservation total as Payment structure
    getReservationPayment(): Payment {
        const state = store.get();
const subtotalMinor = state.parts.reduce((sum, part) => {
            const servicePrices = state.service?.prices || [];
            // amounts are in minor units
            const amountMinor = servicePrices.length > 0 ? getPriceAmount(servicePrices, 'US') : 0;
            return sum + amountMinor;
        }, 0);

        const currencyCode = currency.get();
        return createPaymentForCheckout(
            subtotalMinor,
            'US',
            currencyCode,
            PaymentMethod.Cash
        );
    },
};

export function initReservationStore() {
    actions.updateCalendarGrid();
    businessActions.init(); // Use unified business store

    const savedParts = cartParts.get();
    if (savedParts && savedParts.length > 0) {
        store.setKey("parts", savedParts);
    }

    store.listen((state) => {
        if (
            state.isMultiDay &&
            state.startDate &&
            state.endDate &&
            currentStepName.get() === "datetime" &&
            (!state.slots.length || !state.slots[0].isMultiDay)
        ) {
            actions.createMultiDaySlot();
        }

        if (JSON.stringify(state.parts) !== JSON.stringify(cartParts.get())) {
            cartParts.set(state.parts);
        }
    });

    cartParts.listen((parts) => {
        const currentParts = store.get().parts;
        if (JSON.stringify(parts) !== JSON.stringify(currentParts)) {
            store.setKey("parts", [...parts]);
        }
    });
}

function mapQuoteError(code?: string, fallback?: string): string {
    switch (code) {
        case 'PROMO.MIN_ORDER':
            return fallback || 'Promo requires a higher minimum order.';
        case 'PROMO.NOT_ACTIVE':
            return 'Promo code is not active.';
        case 'PROMO.NOT_YET_VALID':
            return 'Promo code is not yet valid.';
        case 'PROMO.EXPIRED':
            return 'Promo code has expired.';
        case 'PROMO.MAX_USES':
            return 'Promo code usage limit exceeded.';
        case 'PROMO.MAX_USES_PER_USER':
            return 'You have already used this promo code.';
        case 'PROMO.NOT_FOUND':
            return 'Promo code not found.';
        default:
            return fallback || 'Failed to get quote.';
    }
}

export default { store, actions, initReservationStore };
