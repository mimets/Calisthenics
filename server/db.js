import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'apphermann.json');

let storePromise;
let writeQueue = Promise.resolve();

function resolveDbPath() {
  return path.resolve(process.cwd(), process.env.DB_PATH || DEFAULT_DB_PATH);
}

function createEmptyStore() {
  return {
    users: [],
    gyms: [],
    clients: [],
    expenses: [],
  };
}

async function writeStore(store) {
  const filename = resolveDbPath();
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, JSON.stringify(store, null, 2), 'utf8');
}

async function ensureAdminUser(store) {
  if (store.users.length > 0) {
    return store;
  }

  const username = process.env.APP_USERNAME;
  const passwordHash =
    process.env.APP_PASSWORD_HASH ||
    (process.env.APP_PASSWORD ? await bcrypt.hash(process.env.APP_PASSWORD, 12) : null);

  if (!username || !passwordHash) {
    throw new Error(
      'Missing bootstrap credentials. Set APP_USERNAME and APP_PASSWORD or APP_PASSWORD_HASH before starting the server.',
    );
  }

  store.users.push({
    id: 1,
    username: username.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  return store;
}

async function initStore() {
  const filename = resolveDbPath();
  await fs.mkdir(path.dirname(filename), { recursive: true });

  let store = createEmptyStore();

  try {
    const raw = await fs.readFile(filename, 'utf8');
    store = JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  store = await ensureAdminUser({
    users: Array.isArray(store.users) ? store.users : [],
    gyms: Array.isArray(store.gyms) ? store.gyms : [],
    clients: Array.isArray(store.clients) ? store.clients : [],
    expenses: Array.isArray(store.expenses) ? store.expenses : [],
  });

  await writeStore(store);
  return store;
}

async function getStore() {
  if (!storePromise) {
    storePromise = initStore();
  }

  return storePromise;
}

async function persist(mutator) {
  writeQueue = writeQueue.then(async () => {
    const store = await getStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  return writeQueue;
}

export async function ensureStoreReady() {
  await getStore();
}

export async function findUserByUsername(username) {
  const store = await getStore();
  return store.users.find((user) => user.username === username) || null;
}

export async function listGymsForUser(userId) {
  const store = await getStore();
  const gyms = store.gyms
    .filter((gym) => gym.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((gym) => ({
      id: gym.id,
      name: gym.name,
      clients: store.clients
        .filter((client) => client.gymId === gym.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((client) => ({
          id: client.id,
          gymId: client.gymId,
          firstName: client.firstName,
          lastName: client.lastName,
          price: Number(client.price),
          frequency: client.frequency,
        })),
      expenses: store.expenses
        .filter((expense) => expense.gymId === gym.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((expense) => ({
          id: expense.id,
          gymId: expense.gymId,
          label: expense.label,
          amount: Number(expense.amount),
          category: expense.category,
        })),
    }));

  return gyms;
}

export async function createGym(userId, gym) {
  return persist((store) => {
    const row = {
      id: gym.id,
      userId,
      name: gym.name,
      createdAt: new Date().toISOString(),
    };

    store.gyms.push(row);
    return { id: row.id, name: row.name, clients: [], expenses: [] };
  });
}

export async function updateGym(userId, gymId, name) {
  return persist((store) => {
    const gym = store.gyms.find((row) => row.id === gymId && row.userId === userId);

    if (!gym) {
      return false;
    }

    gym.name = name;
    return true;
  });
}

export async function deleteGym(userId, gymId) {
  return persist((store) => {
    const gymIndex = store.gyms.findIndex((row) => row.id === gymId && row.userId === userId);

    if (gymIndex === -1) {
      return false;
    }

    store.gyms.splice(gymIndex, 1);
    store.clients = store.clients.filter((client) => client.gymId !== gymId);
    store.expenses = store.expenses.filter((expense) => expense.gymId !== gymId);
    return true;
  });
}

export async function gymExistsForUser(userId, gymId) {
  const store = await getStore();
  return store.gyms.some((gym) => gym.id === gymId && gym.userId === userId);
}

export async function createClient(gymId, client) {
  return persist((store) => {
    store.clients.push({
      id: client.id,
      gymId,
      firstName: client.firstName,
      lastName: client.lastName,
      price: client.price,
      frequency: client.frequency,
      createdAt: new Date().toISOString(),
    });

    return true;
  });
}

export async function createExpense(gymId, expense) {
  return persist((store) => {
    store.expenses.push({
      id: expense.id,
      gymId,
      label: expense.label,
      amount: expense.amount,
      category: expense.category,
      createdAt: new Date().toISOString(),
    });

    return true;
  });
}

export async function updateClient(userId, clientId, payload) {
  return persist((store) => {
    const allowedGymIds = new Set(store.gyms.filter((gym) => gym.userId === userId).map((gym) => gym.id));
    const client = store.clients.find((row) => row.id === clientId && allowedGymIds.has(row.gymId));

    if (!client) {
      return false;
    }

    client.firstName = payload.firstName;
    client.lastName = payload.lastName;
    client.price = payload.price;
    client.frequency = payload.frequency;
    return true;
  });
}

export async function updateExpense(userId, expenseId, payload) {
  return persist((store) => {
    const allowedGymIds = new Set(store.gyms.filter((gym) => gym.userId === userId).map((gym) => gym.id));
    const expense = store.expenses.find((row) => row.id === expenseId && allowedGymIds.has(row.gymId));

    if (!expense) {
      return false;
    }

    expense.label = payload.label;
    expense.amount = payload.amount;
    expense.category = payload.category;
    return true;
  });
}

export async function deleteClient(userId, clientId) {
  return persist((store) => {
    const allowedGymIds = new Set(store.gyms.filter((gym) => gym.userId === userId).map((gym) => gym.id));
    const clientIndex = store.clients.findIndex((row) => row.id === clientId && allowedGymIds.has(row.gymId));

    if (clientIndex === -1) {
      return false;
    }

    store.clients.splice(clientIndex, 1);
    return true;
  });
}

export async function deleteExpense(userId, expenseId) {
  return persist((store) => {
    const allowedGymIds = new Set(store.gyms.filter((gym) => gym.userId === userId).map((gym) => gym.id));
    const expenseIndex = store.expenses.findIndex((row) => row.id === expenseId && allowedGymIds.has(row.gymId));

    if (expenseIndex === -1) {
      return false;
    }

    store.expenses.splice(expenseIndex, 1);
    return true;
  });
}
