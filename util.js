// customize logging
import console_stamp from 'console-stamp';
console_stamp(console,`yyyy/mm/dd HH:MM:ss`);

// randomize integer in [min, max]
export const random = (min, max) => {
  return Math.random() * (max - min) + min;
}

// wait ms milliseconds
export const wait = ms => new Promise(r => setTimeout(r, ms));

// lowdb start
import { Low, JSONFile } from 'lowdb';
const adapter = new JSONFile('data.json');
const db = new Low(adapter);

export const read = async () => {
  await db.read();
  // convert object into map after reading
  db.data.account_map ? new Map(Object.entries(db.data.account_map)) : undefined;
};

export const write = async () => {
  const account_map_copy = db.data.account_map;
  db.data.accout_map = Object.fromEntries(db.data.account_map);
  // convert map into object
  await db.write();
  // restore after writing
  db.data.account_map = account_map_copy;
}

// initialize data
await read();
db.data ||= { games_cnt : 0, account_map : new Map(), bank_balance : 10000000, sanil_0_wins_cnt: 0, sanil_1_wins_cnt: 0, sanil_2_wins_cnt: 0, };
await write();

export const { data } = db;
// lowdb end
