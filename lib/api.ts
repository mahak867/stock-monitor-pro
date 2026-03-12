import axios from 'axios';
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';
const BASE_URL = 'https://finnhub.io/api/v1';

export const getQuote = async (symbol: string) => {
  try {
    const res = await axios.get(`${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    return res.data;
  } catch (e) { return null; }
};

export const getNews = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/news?category=general&token=${FINNHUB_KEY}`);
    return res.data.slice(0, 5);
  } catch (e) { return []; }
};