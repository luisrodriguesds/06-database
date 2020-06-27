import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // TODO
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Type deve ser income ou outcome');
    }

    if (Number(value) < 0) {
      throw new AppError('Value deve ser positivo');
    }

    const balance = await transactionRepository.getBalance();
    console.log(balance);
    if (type === 'outcome' && Number(value) > balance.total) {
      throw new AppError('Saldo insuficiente', 400);
    }
    // Category
    const findCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id: string;
    if (findCategory) {
      category_id = findCategory.id;
    } else {
      const categoryCreate = await categoryRepository.save({
        title: category,
      });
      category_id = categoryCreate.id;
    }

    // Transaction
    const transaction = await transactionRepository.save({
      title,
      type,
      value,
      category_id,
    });

    return transaction;
  }
}

export default CreateTransactionService;
