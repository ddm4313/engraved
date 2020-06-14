const Discord = require('discord.js');
const client = new Discord.Client();
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
var url = process.env.MONGODB_URI;
var dbName = "heroku_lmftlsm7";

function AddMessage(msg, user, date, avatarURL, messageId, guildId) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db(dbName);
            var myobj = { messageId: messageId,message: msg, user: user, date: date, avatar: avatarURL, guild: guildId};
            dbo.collection("messages").insertOne(myobj, function(err, res) {
                if (err) reject(err);
                console.log("Message saved");
                db.close();
            });
        });
    })
}

client.on('message', message => {

    AddMessage(message.content, `@${message.author.username}#${message.author.discriminator}`, message.createdAt, message.author.avatarURL, message.id, message.guild.id)

});

client.login('token'); // login the bot with your token.
