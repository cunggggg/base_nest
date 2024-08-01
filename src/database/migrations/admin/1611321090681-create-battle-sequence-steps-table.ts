import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const tableName = 'admin.battle_sequence_steps',
  battleSequencesTableName = 'admin.battle_sequences',
  contentsTableName = 'admin.contents',
  battlesTableName = 'admin.contest_battles';

export class createBattleSequenceStepsTable1611321090681
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
            name: 'battle_sequence_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'step',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'battle_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'vote_for',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'vote_rate',
            type: 'numeric',
            isNullable: true,
          },
          {
            name: 'xp_watching_bonus',
            type: 'integer',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['battle_sequence_id'],
            referencedColumnNames: ['id'],
            referencedTableName: battleSequencesTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['battle_id'],
            referencedColumnNames: ['id'],
            referencedTableName: battlesTableName,
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['vote_for'],
            referencedColumnNames: ['id'],
            referencedTableName: contentsTableName,
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
