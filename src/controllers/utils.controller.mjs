import axios from "axios";

import mongoConnectionUtils from "../utils/mongo-connection.utils.mjs";

export const getRate = async (to) => {
  try {
    const rate = await axios.get(
      `https://api.frankfurter.app/latest?from=USD&to=${to}`
    );
    return rate?.data?.rates?.[to] || null;
  } catch (err) {
    return null;
  }
};

export const getProductPrice = async () => {
  try {
    const db = await mongoConnectionUtils.getDB();
    const res = await db?.collection("price").find().toArray();

    return res?.[0] || {};
  } catch (err) {
    return {};
  }
};
