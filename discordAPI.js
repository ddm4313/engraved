const DiscordOauth2 = require("discord-oauth2");
var MongoClient = require('mongodb').MongoClient;
var discord = require('./test.js');
var dbName = "heroku_lmftlsm7";
var url = "http://engraved.dinmavric.dev/link_discord";
require('dotenv').config()

var Discord_ClientID = process.env.Discord_ClientID;
var Discord_ClientSecret = process.env.Discord_ClientSecret;


module.exports = {
    GetAccessToken: function(query) {
        return new Promise((resolve, reject) => {
            var oauth = new DiscordOauth2();
            oauth.tokenRequest({
                clientId: Discord_ClientID,
                clientSecret: Discord_ClientSecret,

                code: query,
                scope: "identify",
                grantType: "authorization_code",

                redirectUri: url,
            }).then(resolve).catch(err => {
                console.log(err);
                resolve(false)
            });
        })
    },
    GetAccessTokenWithREFRESHToken: function (refreshToken) {
        return new Promise((resolve, reject) => {
            var oauth = new DiscordOauth2({
                clientId: Discord_ClientID,
                clientSecret: Discord_ClientSecret,
                redirectUri:  url,
            });

            oauth.tokenRequest({
                // clientId, clientSecret and redirectUri are omitted, as they were already set on the class constructor
                refreshToken: refreshToken,
                grantType: "refresh_token",
                scope: ["identify"],
            }).then(resolve).catch(resolve(false));
            });
    },

    MessageSearch: function(guilds)
{
    var urlDb = process.env.MONGODB_URI;
    return new Promise((resolve, reject) => {
        MongoClient.connect(urlDb, function(err, db) {
            if (err) throw err;
            var dbo = db.db(dbName);
            dbo.collection("messages").find({}, { projection: {_id: 0,guild: 1, user: 1, messageId: 1, message: 1, date: 1 }}).toArray(function(err, result) {
                if (err) reject(err);
                resolve(result.filter(message => guilds.includes(message.guild)));

                db.close();
            });
        });
    })},
    GetOwnedGuilds: function (access_token) {
        var oauth = new DiscordOauth2();
        return new Promise((resolve, reject) => {
        oauth.getUserGuilds(access_token).then(guilds => {
            var ownerGuilds = guilds.filter(guild => guild.owner === true);
            var ids = [];
            ownerGuilds.forEach(guild => ids.push(guild.id));
            resolve(ids);
        }).catch(e => {
            resolve(false)
        });
    })
},
    GetUserInfo: function (access_token) {
        var oauth = new DiscordOauth2();
        return new Promise((resolve, reject) => {
            oauth.getUser(access_token).then(userInfo => {
                resolve(userInfo);
            }).catch(err => {
                console.log(err)
                resolve(false)
            });

        })

}}
