import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, In, getCustomRepository } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    // TODO
    const file = fs.createReadStream(filePath);
    const parse = csvParse({
      from_line: 2,
    }); // Contar a partir da segunda linha

    const transactions: Request[] = [];
    const categories: string[] = [];
    const parseCSV = file.pipe(parse);
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((ceil: string) =>
        ceil.trim(),
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    // Asegurar que só depois que acabar o evento on data a func armezana dentro do arr
    await new Promise(resolve => parseCSV.on('end', resolve));
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const findCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const findCategoriesTitle = findCategories.map(
      (category: Category) => category.title,
    );

    const addCategories = categories
      .filter(category => !findCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategories.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);
    const finalCategories = [...newCategories, ...findCategories];
    const createTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id: finalCategories.find(
          category => category.title === transaction.category,
        )?.id,
      })),
    );

    const newTransactions = await transactionsRepository.save(
      createTransactions,
    );
    await fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
