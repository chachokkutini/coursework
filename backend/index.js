import express, { json } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import { validationResult } from 'express-validator'
import { registrationValidation } from './validation/registration.js';
import { loginValidation } from './validation/login.js';
import { postValidation } from './validation/post.js';
import userSchema from './schemas/user.js';
import postSchema from './schemas/postSchema.js';
import checkAuth from './middleware/checkAuth.js';
import user from './schemas/user.js';

mongoose
    .connect(
        'mongodb+srv://kutjinalex:CTC1DK4lPwqjvgQV@cluster0.dxhypzb.mongodb.net/blog?retryWrites=true&w=majority')
    .then(() => { console.log('db is ok') })
    .catch((err) => { console.log('db not working', err) });

const app = express();



app.use(express.json());

app.post('/auth/registration', registrationValidation, async (req, res) => {
    try {
        const allErr = validationResult(req);
        if (!allErr.isEmpty()) {
            return res.status(400).json(allErr.array());
        }

        const password = req.body.password;
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt)


        const doc = new userSchema({
            email: req.body.email,
            fullName: req.body.fullName,
            passwordHash: hash,
        }
        );

        const user = await doc.save();

        const token = jwt.sign({
            _id: user._id,
        },
            'secret123',
            {
                expiresIn: '1d',
            },
        )

        const { passwordHash, ...userData } = user._doc;

        res.json(
            {
                ...userData,
                token,
            }
        );
    }
    catch (err) {
        res.status(500).json({
            message: 'Не удалось зарегистрироваться',
        });
    }
});

app.post('/auth/login', loginValidation, async (req, res) => {
    try {

        const user = await userSchema.findOne({
            email: req.body.email
        })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Попробуйте еще раз, данные введены неверно'
            })
        }

        const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

        if (!isValidPass) {
            return res.status(404).json({
                success: false,
                message: 'Попробуйте еще раз, данные введены неверно',
            })
        }

        const token = jwt.sign({
            _id: user._id,
        },
            'secret',
            {
                expiresIn: '1d',
            },
        )

        const { passwordHash, ...userData } = user._doc;

        res.json({
            ...userData,
            token,
        }
        );

    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Не удалось авторизоваться, попробуйте еще раз',
        })
    }
})

app.get('/auth/me', checkAuth, async (req, res) => {
    try {
        const user = await userSchema.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Не удалось найти такого пользователя',
            })
        }

        const { passwordHash, ...userData } = user._doc;
        res.json(userData);
    }
    catch (err) {

        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Упс... У вас нет доступа',
        })
    }
})

app.post('/posts', checkAuth, postValidation, async (req, res) => {
    try {
        const doc = new postSchema({
            title: req.body.title,
            text: req.body.text,
            tags: req.body.tags,
            image: req.body.image,
            user: req.userId,
        })
        const post = await doc.save();
        res.json({ post })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "Не удалось создать статью",
        })
    }
})
//get all posts
app.get('/posts', async (req, res) => {
    try {
        const posts = await postSchema.find().populate('user').exec();
        res.json(posts)
    }
    catch (err) {
        res.status(500).json({
            succes: false,
            message: 'Упс... Что-то пошло не так!'
        })
    }
})
//get one post

app.get('/posts/:id', async (req, res) => {
    postSchema.findOneAndUpdate(
        {
            _id: req.params.id,
        },
        {
            $inc: { viewCount: 1 },
        },
        {
            returnDocument: 'after',
        })
        .then(doc => {
            if (!doc) {
                return res.status(404).json({
                    message: 'Статья не найдена'
                })
            }
            res.json(doc)
        }
        ).catch(err => {
            console.log(err);
            return res.status(500).json({
                message: 'Не удалось вернуть статью'
            })
        })
})




app.delete('/posts/:id', checkAuth, async (req, res) => {
    postSchema.findByIdAndDelete(
        { _id: req.params.id, },
    )
        .then(doc => {
            if (!doc) {
                return res.status(404).json({
                    message: 'Статья не найдена'
                })
            }
            res.json({
                message: 'Статья удалена',
                success: true,
            })
        }
        ).catch(err => {
            console.log(err);
            return res.status(500).json({
                message: 'Не удалось удалить статью'
            })
        })
})


app.patch('/posts/:id', checkAuth, async (req, res) => {
    try {
        await postSchema.updateOne(
            {
                _id: req.params.id,
            },
            {
                title: req.body.title,
                text: req.body.text,
                imageUrl: req.body.imageUrl,
                user: req.userId,
                tags: req.body.tags,
            },
        );

        res.json({
            success: true,
            message: 'Статья успешно обновлена',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось обновить статью',
        });
    }
})

app.listen(5500, (err) => {
    if (err) {
        return console.log(err);
    }
    console.log('server ok ');
});

