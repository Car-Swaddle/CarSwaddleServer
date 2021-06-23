import { Router } from 'express';
import { getAllEvents } from '../../controllers/calendar';

const api = Router();

api.get('/all/:key/calendar.ics', getAllEvents);

export = api;
