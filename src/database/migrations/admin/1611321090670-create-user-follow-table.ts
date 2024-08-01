import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tableName = 'admin.user_follow';
const usersTableName = 'admin.users';

export class createUserFollowTable1611321090670 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'id',
            type: 'integer',
            isGenerated: true,
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'follower_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'followed_id',
            type: 'uuid',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['follower_id'],
            referencedColumnNames: ['id'],
            referencedTableName: usersTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['followed_id'],
            referencedColumnNames: ['id'],
            referencedTableName: usersTableName,
            onUpdate: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //If table has foreingn keys, third parameter must to be true
    await queryRunner.dropTable(tableName, true, true);
  }
}
