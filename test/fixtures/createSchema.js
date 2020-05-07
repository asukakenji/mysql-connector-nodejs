'use strict';

const config = require('../config');
const mysqlx = require('../../');

module.exports = function (name, options) {
    options = Object.assign({}, config, options, { auth: 'PLAIN', schema: undefined, ssl: true });

    return mysqlx.getSession(options)
        .then(session => {
            return session.dropSchema(name)
                .then(() => {
                    return session.createSchema(name);
                })
                .then(() => {
                    return session.close();
                });
        });
};
