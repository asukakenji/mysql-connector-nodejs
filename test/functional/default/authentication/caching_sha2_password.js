'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const crypto = require('crypto');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');

describe('caching_sha2_password authentication plugin', () => {
    const baseConfig = { schema: undefined };
    const user = 'foo';
    const password = 'bar';
    const plugin = 'caching_sha2_password';

    context('connecting without an authentication mechanism', () => {
        context('without a password in the server authentication cache', () => {
            context('over TCP and TLS', () => {
                const tcpConfig = { socket: undefined, ssl: true };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeds while falling back to PLAIN using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });

                it('succeeds while falling back to PLAIN using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });

                it('fails when a wrong password is provided using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });

                it('fails when a wrong password is provided using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });
            });

            context('over regular TCP', () => {
                const tcpConfig = { socket: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('fails using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                            expect(err.message).to.match(/Authentication failed using "MYSQL41" and "SHA256_MEMORY"/);
                        });
                });

                it('fails using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                            expect(err.message).to.match(/Authentication failed using "MYSQL41" and "SHA256_MEMORY"/);
                        });
                });
            });

            context('over a UNIX socket', () => {
                const socketConfig = { host: undefined, port: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                afterEach('delete user', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeeds while falling back to PLAIN using a configuration object', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });

                it('succeeds while falling back to PLAIN using a URI', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });

                it('fails when a wrong password is provided using a configuration object', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });

                it('fails when a wrong password is provided using a URI', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });
            });
        });

        context('with the password in the server authentication cache', () => {
            context('over TCP and TLS', () => {
                const tcpConfig = { socket: undefined, ssl: true };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                beforeEach('save the password in the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return fixtures.savePasswordInAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeds while falling back to PLAIN using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });

                it('succeeds while falling back to PLAIN using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });
            });

            context('over regular TCP', () => {
                const tcpConfig = { socket: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                beforeEach('save the password in the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return fixtures.savePasswordInAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeds while falling back to SHA256_MEMORY using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('SHA256_MEMORY');
                            return session.close();
                        });
                });

                it('succeeds while falling back to SHA256_MEMORY using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('SHA256_MEMORY');
                            return session.close();
                        });
                });
            });

            context('over a UNIX socket', () => {
                const socketConfig = { host: undefined, port: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                beforeEach('save the password in the server authentication cache', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.savePasswordInAuthenticationCache(authConfig);
                });

                afterEach('delete user', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeds while falling back to PLAIN using a configuration object', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });

                it('succeeds while falling back to PLAIN using a URI', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal('PLAIN');
                            return session.close();
                        });
                });
            });
        });
    });

    context('connecting with the MYSQL41 authentication mechanism', () => {
        const auth = 'MYSQL41';

        context('over TCP and TLS', () => {
            const tcpConfig = { auth, socket: undefined, ssl: true };

            beforeEach('create user with caching_sha2_password plugin', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.createUser(user, plugin, password, authConfig);
            });

            beforeEach('invalidate the server authentication cache', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.resetAuthenticationCache(authConfig);
            });

            afterEach('delete user', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.dropUser(user, authConfig);
            });

            it('fails using a configuration object', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails using a URI', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });

        context('over regular TLS', () => {
            const tcpConfig = { auth, socket: undefined, ssl: false };

            beforeEach('create user with caching_sha2_password plugin', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.createUser(user, plugin, password, authConfig);
            });

            beforeEach('invalidate the server authentication cache', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.resetAuthenticationCache(authConfig);
            });

            afterEach('delete user', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.dropUser(user, authConfig);
            });

            it('fails using a configuration object', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails using a URI', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });

        context('over a UNIX socket', () => {
            const socketConfig = { auth, host: undefined, port: undefined, ssl: false };

            beforeEach('create user with caching_sha2_password plugin', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.createUser(user, plugin, password, authConfig);
            });

            beforeEach('invalidate the server authentication cache', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.resetAuthenticationCache(authConfig);
            });

            afterEach('delete user', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.dropUser(user, authConfig);
            });

            it('fails using a configuration object', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails using a URI', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });
    });

    context('connecting with the PLAIN authentication mechanism', () => {
        const auth = 'PLAIN';

        context('over TCP and TLS', () => {
            const tcpConfig = { auth, socket: undefined, ssl: true };

            beforeEach('create user with caching_sha2_password plugin', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.createUser(user, plugin, password, authConfig);
            });

            beforeEach('invalidate the server authentication cache', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.resetAuthenticationCache(authConfig);
            });

            afterEach('delete user', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.dropUser(user, authConfig);
            });

            it('succeeds using a configuration object', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('succeeds using a URI', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${auth}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails when a wrong password is provided using a URI', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });

        context('over regular TCP', () => {
            const tcpConfig = { auth, socket: undefined, ssl: false };

            beforeEach('create user with caching_sha2_password plugin', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.createUser(user, plugin, password, authConfig);
            });

            beforeEach('invalidate the server authentication cache', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.resetAuthenticationCache(authConfig);
            });

            afterEach('delete user', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.dropUser(user, authConfig);
            });

            it('fails using a configuration object', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1251);
                    });
            });

            it('fails using a URI', () => {
                const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1251);
                    });
            });
        });

        context('over a UNIX socket', () => {
            const socketConfig = { auth, host: undefined, port: undefined, ssl: false };

            beforeEach('create user with caching_sha2_password plugin', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.createUser(user, plugin, password, authConfig);
            });

            beforeEach('invalidate the server authentication cache', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.resetAuthenticationCache(authConfig);
            });

            afterEach('delete user', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.dropUser(user, authConfig);
            });

            it('succeeds using a configuration object', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('succeeds using a URI', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        expect(session.inspect().auth).to.equal(auth);
                        return session.close();
                    });
            });

            it('fails when a wrong password is provided using a configuration object', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(authConfig)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });

            it('fails when a wrong password is provided using a URI', function () {
                const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password: password.concat(crypto.randomBytes(4).toString('hex')) });

                if (!authConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(1045);
                    });
            });
        });
    });

    context('connecting with the SHA256_MEMORY authentication mechanism', () => {
        const auth = 'SHA256_MEMORY';

        context('without a password in the server authentication cache', () => {
            context('over TCP and TLS', () => {
                const tcpConfig = { auth, socket: undefined, ssl: true };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('fails using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });

                it('fails using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${auth}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });
            });

            context('over regular TCP', () => {
                const tcpConfig = { auth, socket: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('fails using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });

                it('fails using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${auth}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });
            });

            context('over a UNIX socket', () => {
                const socketConfig = { auth, host: undefined, port: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                afterEach('delete user', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropUser(user, authConfig);
                });

                it('fails using a configuration object', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(authConfig)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });

                it('fails using a URI', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1045);
                        });
                });
            });
        });

        context('with the password in the server authentication cache', () => {
            context('over TCP and TLS', () => {
                const tcpConfig = { auth, socket: undefined, ssl: true };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                beforeEach('save the password in the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return fixtures.savePasswordInAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeds using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('succeeds using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?auth=${auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });

            context('over regular TCP', () => {
                const tcpConfig = { auth, socket: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                beforeEach('save the password in the server authentication cache', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return fixtures.savePasswordInAuthenticationCache(authConfig);
                });

                afterEach('delete user', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeds using a configuration object', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('succeeds using a URI', () => {
                    const authConfig = Object.assign({}, config, baseConfig, tcpConfig, { user, password });
                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@${authConfig.host}:${authConfig.port}?ssl-mode=DISABLED&auth=${auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });

            context('over a UNIX socket', () => {
                const socketConfig = { auth, host: undefined, port: undefined, ssl: false };

                beforeEach('create user with caching_sha2_password plugin', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.createUser(user, plugin, password, authConfig);
                });

                beforeEach('invalidate the server authentication cache', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.resetAuthenticationCache(authConfig);
                });

                beforeEach('save the password in the server authentication cache', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.savePasswordInAuthenticationCache(authConfig);
                });

                afterEach('delete user', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig);

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return fixtures.dropUser(user, authConfig);
                });

                it('succeeds using a configuration object', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    return mysqlx.getSession(authConfig)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });

                it('succeeds using a URI', function () {
                    const authConfig = Object.assign({}, config, baseConfig, socketConfig, { user, password });

                    if (!authConfig.socket || os.platform() === 'win32') {
                        return this.skip();
                    }

                    const uri = `mysqlx://${authConfig.user}:${authConfig.password}@(${authConfig.socket})?ssl-mode=DISABLED&auth=${authConfig.auth}`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().auth).to.equal(auth);
                            return session.close();
                        });
                });
            });
        });
    });
});
