import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Course {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true })
  instructorId!: string;

  @Prop({ required: true })
  instructorEmail!: string;

  /**
   * Filled by payment.completed events (event-carried state) so the
   * lecture.created payload can list recipients without a sync call
   * back to the Enrollment service.
   */
  @Prop({ type: [String], default: [] })
  enrolledStudentEmails!: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Derived, not stored: redelivered payment events can't double-count.
CourseSchema.virtual('enrolledCount').get(function () {
  return this.enrolledStudentEmails?.length ?? 0;
});
