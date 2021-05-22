// Update with your config settings.

export default {
  development: {
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'postgres',
      database : 'postgres',
      charset: 'utf8'
    },
    migrations: {
      directory: './db/migrations',
    },
    seeds: {
      directory: './knex/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './knex/migrations',
    },
    seeds: {
      directory: './knex/seeds/production',
    },
  }

};
