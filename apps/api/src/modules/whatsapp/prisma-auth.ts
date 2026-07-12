import { AuthenticationCreds, SignalKeyStore, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';

export const usePrismaAuthState = async (prisma: PrismaClient, businessId: string) => {
  const writeData = async (data: any, keyId: string) => {
    try {
      const dataStr = JSON.stringify(data, BufferJSON.replacer);
      await prisma.whatsAppSession.upsert({
        where: { businessId_keyId: { businessId, keyId } },
        create: { businessId, keyId, data: dataStr },
        update: { data: dataStr },
      });
    } catch (e) {
      console.error(`Error saving auth state for ${businessId}, key ${keyId}:`, e);
    }
  };

  const readData = async (keyId: string) => {
    try {
      const row = await prisma.whatsAppSession.findUnique({
        where: { businessId_keyId: { businessId, keyId } },
      });
      if (row && row.data) {
        return JSON.parse(row.data, BufferJSON.reviver);
      }
      return null;
    } catch (e) {
      console.error(`Error reading auth state for ${businessId}, key ${keyId}:`, e);
      return null;
    }
  };

  const removeData = async (keyId: string) => {
    try {
      await prisma.whatsAppSession.delete({
        where: { businessId_keyId: { businessId, keyId } },
      });
    } catch (e) {
      // Ignore if not found
    }
  };

  let creds: AuthenticationCreds;
  const existingCreds = await readData('creds');
  if (existingCreds) {
    creds = existingCreds;
  } else {
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [_: string]: SignalKeyStore | any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = { ...value, syncKey: Buffer.from(value.syncKey.data) };
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const keyId = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, keyId));
              } else {
                tasks.push(removeData(keyId));
              }
            }
          }
          await Promise.all(tasks);
        },
      } as SignalKeyStore,
    },
    saveCreds: () => writeData(creds, 'creds'),
    clearState: async () => {
      try {
        await prisma.whatsAppSession.deleteMany({
          where: { businessId },
        });
      } catch (error) {}
    }
  };
};
