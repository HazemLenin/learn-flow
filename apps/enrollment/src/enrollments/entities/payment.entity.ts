import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Enrollment } from './enrollment.entity';

export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Enrollment, { onDelete: 'CASCADE' })
  enrollment!: Enrollment;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status!: PaymentStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
