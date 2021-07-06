
export interface CouponModel {
    id: string;
    amountOff: number | null;
    percentOff: number | null;
    redemptions: number;
    maxRedemptions: number | null;
    maxRedemptionsPerUser: number | null;
    name: string;
    redeemBy: Date;
    discountBookingFee: boolean;
    isCorporate: boolean;
}
