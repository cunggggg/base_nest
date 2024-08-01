import { EntityRepository, Repository } from 'typeorm';
import { BattleSequenceStepEntity } from '@modules/battle-sequences/entities/battle-sequence-step.entity';

@EntityRepository(BattleSequenceStepEntity)
export class BattleSequenceStepsRepository extends Repository<BattleSequenceStepEntity> {}
