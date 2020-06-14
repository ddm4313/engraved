var MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
var url = process.env.MONGODB_URI || "mongodb://localhost:27017/";
var discord = require('./discordAPI.js');
var dbName = "heroku_lmftlsm7";


module.exports = {
    ValidateUserLogin: function(email, password) {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(dbName);
                console.log(email, password)
                var query = { email: email, password: password };
                dbo.collection("users").find(query).toArray(function(err, result) {
                    if (err) reject(false);
                    if (result.length === 0) resolve(false)
                    resolve(true)
                    db.close();
                });
            });
        });
    },
    RegisterUser: function(email, password) {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(dbName);
                var myobj = { email: email, password: password};
                dbo.collection("users").insertOne(myobj, function(err, res) {
                    if (err) reject(err);
                    console.log("User added");
                    db.close();
                    resolve(true)
                });
            });
        })
    },
    UpdateToken: function (refreshToken) {
        return new Promise((resolve, reject) => {
            discord.GetAccessTokenWithREFRESHToken(refreshToken).then(res => {
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db(dbName);
                    var myquery = { refresh_token: refreshToken };
                    var newvalues = { $set: {refresh_token: res["refresh_token"] } };
                    dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
                        if (err) resolve(err);
                        resolve(res["refresh_token"])
                        db.close();
                    });
                });
            });
        })
    },

    MessageSearch: function(guilds)
{
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db(dbName);
            dbo.collection("messages").find({}).toArray(function(err, result) {
                if (err) reject(err);
                resolve(result.filter(message => guilds.includes(message.guild)));

                db.close();
            });
        });
    })
},
    AddToken: function (email, refreshToken, accessToken) {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(dbName);
                var myquery = { email: email };
                var date = new Date();
                date.setDate(date.getDate() + 7);
                var newvalues = { $set: {refresh_token: refreshToken, access_token: accessToken, expiresIn: date } };
                dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
                    if (err) resolve(err);
                    resolve(resolve(true))
                    db.close();
                });
            });
        })
    },
    GetUser: function (email) {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(dbName);
                var query = { email: email };
                dbo.collection("users").find(query).toArray(function(err, result) {
                    if (err) resolve(false);
                    resolve(result[0]);
                    db.close();
                });
            });
        })
    },
    UnlinkDiscord: function (email) {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(dbName);
                var myquery = { email: email };
                var newvalues = { $set: {access_token: null, expiresIn: null, refresh_token: null } };
                dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
                    if (err) reject(err);
                    resolve(true);
                    db.close();
                });
            });
        })
    }
}
