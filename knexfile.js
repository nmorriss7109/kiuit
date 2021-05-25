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
    connection: process.env.DATABASE_URL,
    debug: true,
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
