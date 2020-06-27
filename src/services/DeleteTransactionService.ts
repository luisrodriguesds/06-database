import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<boolean> {
    // TODO
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionRepository.find({ where: { id } });
    if (!transaction) {
      throw new AppError('Transação não encontrada', 404);
    }
    const res = await transactionRepository.delete(id);
    return true;
  }
}

export default DeleteTransactionService;
