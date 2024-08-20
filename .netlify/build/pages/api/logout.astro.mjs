import { T as TOKEN } from '../../chunks/constants_DK208udv.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async (ctx) => {
  try {
    ctx.cookies.set(TOKEN, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/"
    });
    return new Response(
      JSON.stringify({
        message: "You're logged out!"
      }),
      {
        status: 200
      }
    );
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({
        message: "Logout failed"
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
