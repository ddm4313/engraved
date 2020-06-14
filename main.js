const express = require('express')
const app = express()
const port = 3000
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const crypto = require('crypto');
var aware = require("./aware.js");
var discord = require('./discordAPI.js');
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();
const rateLimit = require("express-rate-limit");
require('dotenv').config()

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

const apiLimiter = rateLimit({
    windowMs: 15 * 1440 * 1000,
    max: 15
});

Date.prototype.passed = function(){
    return new Date(Date.now()) > this;// the $.now() requires jQuery
}

const authTokens = {};

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("templates"))
app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['AuthToken'];

    // Inject the user to the request
    req.user = authTokens[authToken];

    next();
});

function GetAccessToken(email)
{
    return new Promise((resolve, reject) => {
        aware.GetUser(email).then(userInfo => {
                if (userInfo["refresh_token"] && userInfo["access_token"])
                {
                    resolve(userInfo["access_token"])
                }
                else {
                    reject(false);
                }
            }
        );
    })
}

app.post('/api/v1.0/register', apiLimiter, (req, res) => {
    const { email, password } = req.body;
    aware.GetUser(email).then(emailRes => {
        if (!emailRes)
        {
            aware.RegisterUser(email, getHashedPassword(password)).then(() => {
                res.send({error: false, registered: true});
            }).catch(() => {
                res.send({error: true, registered: false})
            })
        }
        else {
            res.send({error: true, message: 'Username already registered.', registered: false})
        }
    })
});

app.use('/api/v1.0/messages', (req, res) => {
    if (req.user)
    {
        GetAccessToken(req.user).then(accessToken => {
            discord.GetOwnedGuilds(accessToken).then(guilds => {
                discord.MessageSearch(guilds).then(results => {
                    res.send(results);
                });
            });
        });
    }
    else {
        res.send({discordLinked: false})
    }
})

app.post('/api/v1.0/me', (req, res) => {
    if (req.user)
    {
        aware.GetUser(req.user).then(userInfo => {
            if (userInfo["refresh_token"] && userInfo["access_token"])
            {
                discord.GetUserInfo(userInfo["access_token"]).then(result => {
                    result.discordLinked = true;
                    res.send(result);
                }).catch(err => {
                    res.send({'error': true});
                })
            }
            else {
                res.send({'discordLinked': false})
            }
            }
            );
    }
    else {
        res.status(401).sendFile(__dirname + '/templates/error.html');
    }
})

app.get('/logout', (req, res) => {
    if (req.user)
    {
        res.clearCookie('AuthToken');
        delete authTokens[req.user];
        req.user = null;

        res.status(302).redirect('/login')
    }
    else {
        res.status(401).sendFile(__dirname + '/templates/error.html');
    }
})

app.get('/unlink_discord', (req, res) => {
    if (req.user) {
        aware.GetUser(req.user).then(userInfo => {
            if (userInfo["refresh_token"] && userInfo["access_token"])
            {
                aware.UnlinkDiscord(req.user).then(res.send({error: false})).catch(res.send({error: true}));
                return
            }
            else {
                res.send({message: "Discord already unlinked!"});
                return
            }
        });
    }
    else {
        res.send({message: "Not authorized"}).status(401);
    }
})

app.get('/link_discord', (req, res) => {
    if (req.user) {

        aware.GetUser(req.user).then(userInfo => {
            if (userInfo["refresh_token"] && userInfo["access_token"])
            {
                discord.GetUserInfo(userInfo["access_token"]).then(result => {
                    res.status(204).redirect("/dashboard");
                }).catch(err => {
                    res.send({'error': true});
                })
            }
            else {
                if (req.query.code)
                {
                    if (req.query.code < 6)
                    {
                        res.status(401).sendFile(__dirname + '/templates/error.html');
                        return
                    }
                    try {
                        discord.GetAccessToken(req.query.code).then(resp => {
                            if (resp){
                                aware.AddToken(req.user, resp["refresh_token"], resp["access_token"])
                                res.status(204).redirect("/dashboard");
                            }else {
                                res.status(401).sendFile(__dirname + '/templates/error.html');
                            }
                        }).catch(() => {
                            res.status(401).sendFile(__dirname + '/templates/error.html');
                        })
                    }
                    catch (e)
                    {
                        res.status(401).sendFile(__dirname + '/templates/error.html');
                        return
                    }
                }
                else {
                    res.status(401).sendFile(__dirname + '/templates/error.html');
                    return
                }
            }
        });
    }
    else {
        res.sendFile(__dirname + '/templates/error.html');
        return
    }
})

app.get('/login', (req, res) => {
    if (req.user) {
        res.status(302)
            .redirect('/');
    } else {
        res.sendFile(__dirname + '/templates/login.html');
    }
});

app.get('/dashboard', (req, res) => {
    if (req.user) {
        res.sendFile(__dirname + '/templates/dashboard.html');
    }
    else {
        res.status(302).redirect('/login');
    }
})

app.post('/api/v1/login', (req, res) => {
    try {
        if (req.user) {
            res.send({user: email, loggedIn: true, error: false, message: "Already authenticated!"})
        }
        const { email, password } = req.body;
        const hashedPassword = getHashedPassword(password);
        aware.ValidateUserLogin(email, hashedPassword).then(resolution => {
            res.status(200);
            if (resolution)
            {
                const authToken = generateAuthToken();

                // Store authentication token
                authTokens[authToken] = email;

                // Setting the auth token in cookies
                res.cookie('AuthToken', authToken);
                res.send({user: email, loggedIn: true, error: false, message: 'Authentication successful!'})
            }
            else {
                res.send({user: email, loggedIn: false, error: false, message: 'Invalid username or password!'})
            }
        })
    }
    catch (e)
    {
        res.status(401);
        res.send({error: true})
    }
});

app.listen(process.env.PORT || 5000)