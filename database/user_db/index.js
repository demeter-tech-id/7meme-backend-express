
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

module.exports.getUserById = function getUserById(id, onSuccess, onError) {
    client.connect(err => {
        if (err) {
            onError(err);
        } else {
            let collection = client.db(db_name).collection('users');
            collection.findOne({ _id: new ObjectId(id) }, (err, user) => {
                if (err) {
                    onError(err);
                } else {
                    onSuccess(user);
                }
            });
        }
    });
}

module.exports.getPostById = function getPostById(id, onSuccess, onError) {
    client.connect(err => {
        if (err) {
            onError(err);
        }
        else {
            let collection = client.db(db_name).collection('posts');
            collection.findOne({ _id: new ObjectId(id) }, (err, post) => {
                if (err) {
                    onError(err);
                } else {
                    onSuccess(post);
                }
            });
        }
    });
}

module.exports.getPosts = function getPosts(offset, limit, onSuccess, onError) {
    client.connect(err => {
        if (err) {
            onError(err);
        } else {
            let collection = client.db(db_name).collection('posts');
            let cursor = collection.find({});
            cursor.skip(offset);
            cursor.limit(limit);
            cursor.toArray((err, posts) => onSuccess(posts));
        }
    });
}