
export interface OilChangePricingModel {
    id: string;
    conventional: number;
    conventionalPerQuart: number;
    blend: number;
    blendPerQuart: number;
    synthetic: number;
    syntheticPerQuart: number;
    highMileage: number;
    highMileagePerQuart: number;
    centsPerMile: number;
}
