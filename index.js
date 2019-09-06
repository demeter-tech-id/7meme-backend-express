const express = require('express');
const bodyParser = require('body-parser');
const Cryptr = require('cryptr');

const userDB = require('./database/user_db');

const PORT = process.env.PORT || 5000;

function defaultResponseHeader(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

function requestAnalyticsHandler(req, res, next) {
    next();
}

function loginRequiredHandler(req, res, next) {
    next();
}

function exctractUUID(uuid) {
    let decrypted = sessionCryptr.decrypt(uuid);
    let uid = decrypted.substring(0, 24);
    let sid = decrypted.substring(24);
    if (uid.length != 24 || sid.length != 24) {
        throw Error('Invalid UUID');
    }
    return { uid, sid };
}

function getUUIDParam(req) {
    try {
        let { uuid } = req.params;
        return exctractUUID(uuid);
    } catch (err) {
        res.sendStatus(400);
        return;
    }
}

const sessionCryptr = new Cryptr('190496');

express()
    .use(bodyParser.json())
    .use(requestAnalyticsHandler)
    .use(defaultResponseHeader)
    .get('/post/:id', (req, res) => {
        userDB.getPostById(req.params.id)
            .then(post => {
                if (post) {
                    res.json(post);
                } else {
                    res.sendStatus(404);
                }
            })
            .catch(err => {
                res.sendStatus(500);
                console.warn(err);
            })
    })
    .get('/posts/:offset/:limit', (req, res) => {
        let { offset, limit } = req.params;
        offset = parseInt(offset);
        limit = parseInt(limit);
        if (isNaN(offset) || isNaN(limit)) {
            res.sendStatus(400);
            return;
        }
        userDB.getPosts(offset, limit)
            .then(posts => {
                if (posts) {
                    res.json(posts);
                } else {
                    res.sendStatus(500);
                }
            })
            .catch(err => {
                res.sendStatus(500);
                console.warn(err);
            });
    })
    .get('/user/:username', [loginRequiredHandler], (req, res) => {
        userDB.getUserByName(req.params.username)
            .then(user => {
                if (user) {
                    res.json(user);
                } else {
                    res.sendStatus(404);
                }
            })
            .catch(err => {
                res.sendStatus(500);
                console.console.warn(err);
            });
    })
    .post('/create_post', [loginRequiredHandler], (req, res) => {
        if (!req.body || !req.body.title || !req.body.author || !req.body.image_url) {
            res.sendStatus(400);
            return;
        }
        userDB.createPost(req.query.sid, {
            title: req.body.title,
            author: req.body.author,
            image_url: req.body.image_url
        })
            .then(post => {
                res.json(post);
            })
            .catch(err => {
                res.sendStatus(500);
                console.warn(err);
            });
    })
    .post('/login', (req, res) => {
        if (!req.body || !req.body.username || !req.body.password) {
            res.sendStatus(400);
            return;
        } else {
            let { username, password } = req.body;
            userDB.getUserByName(username)
                .then(user => {
                    if (user.password == password) {
                        userDB.login(user._id)
                            .then(sid => {
                                let uuid = sessionCryptr.encrypt(user._id + sid);
                                res.json({ uuid, username: user.username });
                            })
                            .catch(err => {
                                res.sendStatus(500);
                                console.warn(err);
                            });
                    } else {
                        res.sendStatus(404);
                    }
                })
                .catch(err => {
                    res.sendStatus(500);
                    console.warn(err);
                });
        }
    })
    .get('/logout/:uuid', (req, res) => {
        const { sid } = getUUIDParam(req);
        userDB.logout(sid)
            .then(() => {
                res.sendStatus(200);
            })
            .catch(err => {
                res.sendStatus(500);
                console.warn(err);
            })
    })
    .get('/check_session/:uuid', (req, res) => {
        const { uid, sid } = getUUIDParam(req);
        userDB.getUserBySessionId(sid)
            .then(user => {
                if (user) {
                    if (uid == user._id) {
                        res.sendStatus(200);
                    } else {
                        res.sendStatus(403);
                    }
                } else {
                    res.sendStatus(404);
                }
            })
            .catch(err => {
                res.sendStatus(500);
                console.warn(err);
            });
    })
    .options('*', (req, res) => {
        res.status(200);
        res.end();
    })
    .get('*', (req, res) => {
        res.sendStatus(404);
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
