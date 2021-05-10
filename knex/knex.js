import cfg from "../knexfile.js"
import knex from "knex";

const environment = process.env.ENVIRONMENT || 'development';
const config = cfg[environment];
export default knex(config);