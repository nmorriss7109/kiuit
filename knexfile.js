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
      directory: './db/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      // host: 'ec2-18-211-97-89.compute-1.amazonaws.com',
      // database: 'dbb4nhfchi0ml9',
      // user: 'hyvztknsknozgm',
      // password: '8282c0759bc29a3756e673ccde55ae4795a2dba93d3b17564904893a8c3ffb7e',
      ssl: { rejectUnauthorized: false }
    },
    debug: true,
    migrations: {
      directory: './db/migrations',
    },
    seeds: {
      directory: './db/seeds/production',
    },
  }

};
