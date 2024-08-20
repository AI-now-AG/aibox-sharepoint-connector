import { nanoid } from 'nanoid';
import { SignJWT } from 'jose';
import { T as TOKEN } from '../../chunks/constants_DK208udv.mjs';
import { ObjectId } from 'mongodb';
import { d as db } from '../../chunks/mongodb_BtEbS6qU.mjs';
import { z } from 'zod';
import crypto from 'node:crypto';
export { renderers } from '../../renderers.mjs';

const UserSchema = z.object({
  tenant_id: z.instanceof(ObjectId),
  username: z.string().min(2),
  email: z.string(),
  password: z.string().min(8),
  roles: z.array(z.string()),
  created_at: z.date(),
  updated_at: z.date()
});
const collection = db.collection("users");
const UserModel = {
  add: async (user) => {
    const validated = UserSchema.parse(user);
    return collection.insertOne(validated);
  },
  list: async () => collection.find({}),
  get: async (email) => collection.findOne({ email })
};

const verify = (password, hash) => new Promise((resolve, reject) => {
  const [salt, key] = hash.split(".");
  const keyBuffer = Buffer.from(key, "hex");
  crypto.scrypt(password, salt, 64, (err, derivedKey) => {
    if (err) return reject(err);
    resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
  });
});
const secret = new TextEncoder().encode(undefined                              );
const POST = async (ctx) => {
  const formData = await ctx.request.formData();
  try {
    const email = formData.get("email");
    if (typeof email !== "string" || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return new Response(JSON.stringify({ message: "Invalid username" }), {
        status: 400
      });
    }
    const password = formData.get("password") || "";
    const user = await UserModel.get(email);
    if (user && await verify(password, user.password)) {
      const token = await new SignJWT({
        userId: user._id,
        username: user.username,
        tenantId: user.tenant_id
      }).setProtectedHeader({ alg: "HS256" }).setJti(nanoid()).setIssuedAt().setExpirationTime("2h").sign(secret);
      ctx.cookies.set(TOKEN, token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 2
        // 2 hours in seconds
      });
    } else {
      return new Response(
        JSON.stringify({
          message: "Invalid username or password"
        }),
        {
          status: 500
        }
      );
    }
    return new Response(
      JSON.stringify({
        message: "You're logged in!"
      }),
      {
        status: 200
      }
    );
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({
        message: "Login failed....",
        error
      }),
      {
        status: 500
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
