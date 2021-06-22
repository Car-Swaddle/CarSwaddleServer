import { Router } from 'express';
import { getAllEvents } from '../../controllers/calendar';

const api = Router();

api.get('/all/:id/calendar.ics', getAllEvents);

export = api;
