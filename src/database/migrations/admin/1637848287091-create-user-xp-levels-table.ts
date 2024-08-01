import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { createXpLevelsTable1637848287090 } from '@database/migrations/admin/1637848287090-create_xp_levels_table';

const tableName = 'admin.user_xp_levels',
  usersTableName = 'admin.users',
  xpLevelsTableName = 'admin.xp_levels';

export class createBattleSequencesTable1637848287091
  implements MigrationInterface {
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
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'level',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'xp',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'rewards_claim',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'energy',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'last_time_checked',
            type: 'timestamp without time zone',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: usersTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['level'],
            referencedColumnNames: ['level'],
            referencedTableName: xpLevelsTableName,
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
