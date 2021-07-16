import { DBPoint } from "./types";

export interface RegionModel {
    id: string;
    origin: DBPoint;
    radius: number;
}
