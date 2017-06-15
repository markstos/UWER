import register from '../models/register';
import { Router } from 'express';

let api = Router();

api.get('/list', (req, res) => {
    register.list().then((result) => {
        res.json(result);
    });
});

api.post('/:cardId', (req, res) => {
    console.log("received post with cardId:", req.params.cardId)
    register.add(req.params.cardId.toString()).then((result) => {
        res.json(result);
    })
    .catch((err) => {
        res.json({"Error": err});
    })
});

export default api;



