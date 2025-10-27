// Unified cart store that manages both e-shop and reservation carts
import { computed } from "nanostores";
import { cartItems as eshopItems } from "./eshop";
import { cartParts as reservationItems } from "./reservation";

// Combined cart count
export const totalCartItems = computed([eshopItems, reservationItems], (eshop, reservation) => {
    const eshopCount = eshop?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const reservationCount = reservation?.length || 0;
    return eshopCount + reservationCount;
});

// Cart state helpers
export const hasEshopItems = computed(eshopItems, (items) => items?.length > 0);
export const hasReservationItems = computed(reservationItems, (items) => items?.length > 0);
export const isCartEmpty = computed([eshopItems, reservationItems], (eshop, reservation) => {
    return (!eshop || eshop.length === 0) && (!reservation || reservation.length === 0);
});

// Cart section visibility logic
export const showEshopSection = computed([hasEshopItems, isCartEmpty], (hasEshop, isEmpty) => hasEshop || isEmpty);
export const showReservationSection = computed([hasReservationItems, isCartEmpty], (hasReservation, isEmpty) => hasReservation || isEmpty);
export const showBothSections = computed([hasEshopItems, hasReservationItems], (hasEshop, hasReservation) => hasEshop && hasReservation);