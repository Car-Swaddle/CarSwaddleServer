
export interface CouponModel {
    id: string;
    amountOff?: number;
    percentOff?: number;
    redemptions: number;
    maxRedemptions?: number;
    maxRedemptionsPerUser?: number;
    name: string;
    redeemBy: Date;
    discountBookingFee: boolean;
    isCorporate: boolean;
}
