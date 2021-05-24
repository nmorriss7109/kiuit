export function up(knex, Promise) {
  return knex.schema.createTable('sessions', (table) => {
        table.uuid('session_id').primary();
        table.string('name').notNullable();
        table.string('room_name').notNullable();
        table.enu('permissions', ['host', 'admin', 'guest']).notNullable();
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
    }).createTable('rooms', (table) => {
        table.string('room_name').primary();
        table.uuid('host_id').notNullable();
        table.string('spotify_token').nullable();
        table.string('refresh_token').nullable();
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
    }).createTable('tracks', (table) => {
        table.increments('track_id').primary();
        table.string('name').notNullable();
        table.string('artist').notNullable();
        table.string('thumbnail_url');
        table.string('room_name').notNullable();
        table.uuid('added_by');
        table.integer('likes');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
    }).then((res) => {
        console.log(res);
        console.log('rooms, sessions, and tracks tables are created!');
    })
}

export function down(knex, Promise) {
  return knex.schema.dropTable('sessions')
    .dropTable('rooms')
    .dropTable('tracks')
    .then(() => console.log('rooms and sessions tables have been dropped.'))
}
