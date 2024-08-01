import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { commonFields } from '../common.fields';

const tableName = 'admin.contests';
const usersTableName = 'admin.users';

export class createContestsTable1611321090667 implements MigrationInterface {
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
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '1000',
            isNullable: false,
          },
          {
            name: 'long_description',
            type: 'varchar',
            length: '2000',
            isNullable: true,
          },
          {
            name: 'rewards',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'creator_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'creator_avatar',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'creator_country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'image_cover',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'video_intro',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'video_intro_img',
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'single_upload',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'promote',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'promote_order',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'owner',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'rules',
            type: 'varchar',
          },
          {
            name: 'state',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'video_max_length',
            type: 'integer',
            isNullable: false,
            default: 15,
          },
          {
            name: 'participant_prize',
            type: 'varchar',
            isNullable: false,
            default: "'3,2'",
          },
          {
            name: 'contestant_rewards',
            type: 'varchar',
            isNullable: false,
            default: "'10,6,4'",
          },
          {
            name: 'vote_rewards',
            type: 'integer',
            isNullable: false,
            default: 1,
          },
          {
            name: 'xp_rewards',
            type: 'varchar',
            isNullable: false,
            default: "'10,5,20,10'",
          },
          {
            name: 'min_vote',
            type: 'integer',
            default: 0,
          },
          {
            name: 'min_participants',
            type: 'integer',
            default: 0,
          },
          {
            name: 'max_participants',
            type: 'integer',
            default: 0,
          },
          {
            name: 'start_time',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'submission_deadline',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'expire_time',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          ...commonFields,
        ],
        foreignKeys: [
          {
            columnNames: ['owner'],
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
    await queryRunner.dropTable(tableName, true);
  }
}
