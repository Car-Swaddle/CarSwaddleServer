
export type Referrer = {
    id: string,
    stripeExpressAccountID: string | null,
    activeCouponID: string | null,
    activePayStructureID: string | null,
    vanityID: string | null,
};

export type User = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
};
