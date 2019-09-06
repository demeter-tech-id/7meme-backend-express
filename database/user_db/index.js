
const { MongoClient, ObjectId } = require('mongodb');

const db_name = 'user_db';
const db_username = 'user';
const db_password = 'tt53rPwdVGe7UL4j';
const db_url = `mongodb+srv://${db_username}:${db_password}@7meme-esvnp.mongodb.net/${db_name}`;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
const client = new MongoClient(db_url, options);


module.exports.getUserById = getUserById;
module.exports.getUserByName = getUserByName;
module.exports.getPostById = getPostById;
module.exports.getPosts = getPosts;
module.exports.createPost = createPost;


function getUserById(uid) {
    uid = uid instanceof ObjectId ? uid : new ObjectId(uid);
    return new Promise((resolve, reject) => {
        client.connect()
            .then(() => {
                let collection = client.db(db_name).collection('users');
                collection.findOne({ _id: uid })
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}

function getUserByName(username) {
    return new Promise((resolve, reject) => {
        client.connect()
            .then(() => {
                let collection = client.db(db_name).collection('users');
                collection.findOne({ username })
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}

function getPostById(id) {
    return new Promise((resolve, reject) => {
        client.connect()
            .then(() => {
                let collection = client.db(db_name).collection('posts');
                collection.findOne({ _id: id instanceof ObjectId ? id : new ObjectId(id) })
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}

function getPosts(offset, limit) {
    return new Promise((resolve, reject) => {
        client.connect()
            .then(() => {
                let collection = client.db(db_name).collection('posts');
                let cursor = collection.find({});
                cursor.skip(offset);
                cursor.limit(limit);
                cursor.toArray((err, posts) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(posts)
                    }
                });
            })
            .catch(reject);
    });
}

function createPost(uid, post) {
    return new Promise((resolve, reject) => {
        uid = uid instanceof ObjectId ? uid : new ObjectId(uid);
        client.connect()
            .then(() => {
                getUserById(uid)
                    .then(user => {
                        let collection = client.db(db_name).collection('posts');
                        collection.insertOne(post)
                            .then(result => {
                                let postId = result.ops[0]._id;
                                user.posts.push(postId);
                                let collection = client.db(db_name).collection('users');
                                collection.updateOne({ _id: uid }, { $set: { posts: user.posts } })
                                    .then(() => {
                                        post._id = postId;
                                        resolve(post);
                                    })
                                    .catch(reject);
                            })
                            .catch(reject);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

module.exports.login = function login(uid) {
    return new Promise((resolve, reject) => {
        uid = uid instanceof ObjectId ? uid : new ObjectId(uid);
        client.connect()
            .then(() => {
                let collection = client.db(db_name).collection('sessions');
                collection.findOne({ uid })
                    .then(session => {
                        if (session) {
                            collection.updateOne({ _id: session._id }, { $set: { count: session.count + 1 } })
                                .then(() => {
                                    resolve(session._id);
                                })
                                .catch(reject);
                        } else {
                            collection.insertOne({ uid, count: 1 })
                                .then(result => {
                                    let session = result.ops[0];
                                    resolve(session._id);
                                })
                                .catch(reject);
                        }
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

module.exports.logout = function logout(sid) {
    return new Promise((resolve, reject) => {
        sid = sid instanceof ObjectId ? sid : new ObjectId(sid);
        client.connect()
            .then(() => {
                let collection = client.db(db_name).collection('sessions');
                collection.findOne({ _id: sid })
                    .then((session) => {
                        if (session.count > 1) {
                            collection.updateOne({ _id: sid }, { $set: { count: session.count - 1 } })
                                .then(() => resolve(session.count - 1))
                                .catch(reject);
                        } else {
                            collection.deleteOne({ _id: sid })
                                .then(() => resolve(0))
                                .catch(reject);
                        }
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

module.exports.getUserBySessionId = function getUserBySessionId(sid) {
    return new Promise((resolve, reject) => {
        sid = sid instanceof ObjectId ? sid : new ObjectId(sid);
        client.connect()
            .then(() => {
                let collection = client.db(db_name).collection('sessions');
                collection.findOne({ _id: sid })
                    .then(session => {
                        if (session) {
                            getUserById(session.uid)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            resolve(null);
                        }
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}