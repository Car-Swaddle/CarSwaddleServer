import { DBPoint } from "./types";

export interface LocationModel {
    id: string;
    point: DBPoint;
    streetAddress: string;
}
