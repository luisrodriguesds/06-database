import fs from 'fs';
import csv from 'csvtojson';
import path from 'path';
import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    // TODO
    const createTransaction = new CreateTransactionService();
    const { directory } = uploadConfig;
    const fileDir = path.resolve(directory, filename);
    const arr: Request[] = await csv().fromFile(fileDir);
    const transactions = await Promise.all(
      arr.map(async transaction => {
        const trans = await createTransaction.execute(transaction);
        return trans;
      }),
    );

    fs.unlink(fileDir, () => {});
    return transactions;
  }
}

export default ImportTransactionsService;
