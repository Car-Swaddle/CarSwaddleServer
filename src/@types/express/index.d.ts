import * as express from 'express';

declare global {
    namespace Express {
        interface Request {
            user: any // TODO - update this to real user object when ready
        }
    }
}