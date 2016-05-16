'use strict';

const db = require('../db');
const Sequelize = require('sequelize');
const shortid = require('shortid');
const crypto = require('crypto');

const Board = require('./Board');

const User = db.define('user', {
    id: {
        type: Sequelize.STRING,
        defaultValue: shortid.generate,
        primaryKey: true
    },
    username: {
        type: Sequelize.STRING,
        defaultValue: '',
        validate: {
            notEmpty: {
                args: true,
                msg: 'Username is required'
            },
            len: {
                args: [3, 20],
                msg: 'Username must be between 3 and 20 charachters length'
            },
            is: {
                args: /^\S*$/g,
                msg: 'Username must not contain spaces'
            },
            isUnique: function (username, next) {
                User.count({ where: { username } })
                    .then(length => {
                        if (length) { return next('Username is already in use') }
                        next();
                    })
                    .catch(next);
            }
        }
    },
    email: {
        type: Sequelize.STRING,
        defaultValue: '',
        validate: {
            notEmpty: {
                args: true,
                msg: 'Email is required'
            },
            isEmail: {
                args: true,
                msg: 'Email is not valid'
            },
            isUnique: function (email, next) {
                User.count({ where: { email } })
                    .then(length => {
                        if (length) { return next('Email is already in use') }
                        next();
                    })
                    .catch(next);
            }
        }
    },
    password: {
        type: Sequelize.VIRTUAL,
        defaultValue: '',
        set: function (value) {
            this.setDataValue('password', value);
        },
        validate: {
            notEmpty: {
                args: true,
                msg: 'Password is required'
            },
            isLongEnough: function (value) {
                if (value.toString().length < 6) {
                    throw new Error('Password must be at least 6 charachters length');
                }
            }
        }
    },
    confirmation: {
        type: Sequelize.VIRTUAL,
        defaultValue: '',
        set: function (value) {
            this.setDataValue('confirmation', value);
        },
        validate: {
            notEmpty: {
                args: true,
                msg: 'Password confirmation is required'
            },
            isMatching: function (confirmation) {
                if (confirmation !== this.get('password')) {
                    throw new Error('Passwords not match');
                }
            }
        }
    },
    hash: {
        type: Sequelize.STRING
    },
    salt: {
        type: Sequelize.STRING
    }
}, {
    hooks: {
        beforeValidate(user) {
            user.username = user.username.toLowerCase();
            user.email = user.email.toLowerCase();
        },
        afterValidate(user) {
            const password = user.get('password');
            const salt = Math.random() + '';
            const hash = encryptPassword(password, salt);

            user.salt = salt;
            user.hash = hash;
        }
    },
    defaultScope: {
        attributes: ['id', 'username']
    },
    scopes: {
        self: {
            attributes: ['id', 'username', 'email'],
            include: [{
                model: Board
            }]
        },
    }
});

function encryptPassword(password, salt) {
    return crypto.createHash('md5').update(password + salt).digest('hex');
};

module.exports = User;
