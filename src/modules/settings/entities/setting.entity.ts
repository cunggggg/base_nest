import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@database/entities';

@Entity({ schema: 'admin', name: 'settings' })
export class SettingEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'value',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  value: string;

  @Column({
    name: 'type',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  type: string;

  constructor(entity?: Partial<SettingEntity>) {
    super();
    Object.assign(this, entity);
  }
}
