import { ObjectId } from 'mongodb';
import { z } from 'zod';

const stringToObjectId = z.string().transform((id) => new ObjectId(id));

export { stringToObjectId as s };
