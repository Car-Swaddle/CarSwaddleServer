import { Router } from 'express';
import { createGiftCard, deleteGiftCard, getGiftCardByCode, getGiftCardByID } from '../../controllers/gift-card-controller';

const api = Router();

api.get('/gift-cards/:id', getGiftCardByID);

api.get('/gift-cards/code/:id', getGiftCardByCode)

api.post('/gift-cards', createGiftCard)

api.delete('/gift-cards/:id', deleteGiftCard);

export = api;
