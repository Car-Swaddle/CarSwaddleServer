import { Sequelize } from "sequelize";
import { PayStructureStatic } from "./payStructure";
import { ReferrerStatic } from "./referrer";

export interface Models {
    sequelize: Sequelize;
    PayStructure: PayStructureStatic;
    Referrer: ReferrerStatic;
  
    User: any;
    AutoService: any;
    Location: any;
    OilChange: any;
    Price: any;
    PricePart: any;
    Vehicle: any;
    VehicleDescription: any;
    Mechanic: any;
    Region: any;
    TemplateTimeSpan: any;
    ServiceEntity: any;
    DeviceToken: any;
    Address: any;
    Review: any;
    Verification: any;
    TransactionMetadata: any;
    TransactionReceipt: any;
    MechanicMonthDebit: any;
    MechanicPayoutDebit: any;
    OilChangePricing: any;
    PasswordReset: any;
    SubscriptionSettings: any;
    Authority: any;
    AuthorityConfirmation: any;
    AuthorityRequest: any;
    Coupon: any;
  }