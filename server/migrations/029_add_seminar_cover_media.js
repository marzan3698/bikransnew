export async function up(conn) {
  await conn.query(`
    ALTER TABLE seminars
    ADD COLUMN cover_media_type VARCHAR(20) NULL,
    ADD COLUMN cover_media_value VARCHAR(500) NULL
  `)
}

export async function down(conn) {
  await conn.query(`
    ALTER TABLE seminars
    DROP COLUMN cover_media_type,
    DROP COLUMN cover_media_value
  `)
}
