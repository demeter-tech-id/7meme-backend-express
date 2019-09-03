const express = require('express');
const { join } = require('path');

const userDB = require('./database/user_db');

const { static } = express;

const PORT = process.env.PORT || 5000


function validateParam(res, ok) {
    if (!ok) {
        res.status(400);
        res.end();
    }
    return ok;
}

express()
    .use(static(join(__dirname, 'public')))
    .set('views', join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/post/:id', (req, res) => {
        userDB.getPostById(req.params.id, post => {
            if (post) {
                res.json(post);
            } else {
                res.status(404);
                res.end();
            }
        }, err => {
            console.error(err);
            res.status(500);
            res.end();
        });
    })
    .get('/posts/:offset/:limit', (req, res) => {
        let { offset, limit } = req.params;
        offset = parseInt(offset);
        limit = parseInt(limit);
        if (!validateParam(res, !isNaN(offset) && !isNaN(limit))) {
            return;
        }
        userDB.getPosts(offset, limit, posts => {
            if (posts) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.json(posts);
            } else {
                res.status(500);
                res.end();
            }
        }, err => {
            console.error(err);
            res.status(500);
            res.end();
        });
    })
    .get('/user/:id', (req, res) => {
        userDB.getUserById(req.params.id, user => {
            if (user) {
                res.json(user);
            } else {
                res.status(404);
                res.end();
            }
        }, err => {
            console.log(err);
            res.status(500);
            res.end();
        });
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
