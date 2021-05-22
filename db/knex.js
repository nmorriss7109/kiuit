import knex from "knex";

const cfg = await import('../knexfile.js');

const environment = process.env.ENVIRONMENT || 'development';
const config = cfg.default[environment];
export default knex(config);