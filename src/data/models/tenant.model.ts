import mongoose, { Schema } from 'mongoose';

interface ITenant {
  name: string;
  org_name: string;
  created_at: Date;
  updated_at: Date;
}

export const TenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: true,
  },
  org_name: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: new Date(),
  },
  updated_at: {
    type: Date,
    default: new Date(),
  },
});

export default mongoose.model<ITenant>('Tenant', TenantSchema);