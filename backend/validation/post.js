import { body } from "express-validator";

export const postValidation = [
    body('title').isLength({min:1}).isString(),
    body('text').isLength({min:1}).isString(),
    body('tags').optional().isArray(),
    body('image').optional().isString(),
];