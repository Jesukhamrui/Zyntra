import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.resolve(__dirname, '../../data/users.json');

const ensureUsersFile = async () => {
  try {
    await fs.access(usersFilePath);
  } catch {
    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    await fs.writeFile(usersFilePath, '[]', 'utf-8');
  }
};

export const readUsers = async () => {
  await ensureUsersFile();
  const raw = await fs.readFile(usersFilePath, 'utf-8');
  return JSON.parse(raw || '[]');
};

export const writeUsers = async (users) => {
  await ensureUsersFile();
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
};
