import handler from "../dist/serverless.mjs";

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
